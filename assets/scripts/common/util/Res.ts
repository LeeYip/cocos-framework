/** 资源缓存基础数据结构 */
interface CacheData {
    asset: cc.Asset,
    /** 资源是否需要释放 */
    release: boolean,
    /** 资源最后一次被加载的时间点（秒） */
    lastLoadTime: number,
}

/** 预制体资源缓存数据 */
interface PrefabCacheData extends CacheData {
    /** 此prefab关联的实例节点 */
    nodes?: cc.Node[],
}

/** asset bundle路径校验 */
const BUNDLE_CHECK = "ab:";

/**
 * 资源管理类
 * 
 * 资源加载:
 * 1. 如果加载resources内的资源，直接写明resources内的路径即可
 * 2. 如果加载路径以ab:开头，则会加载对应bundle内的资源。例：ab:bundleA/xxx/a表示bundle名为bundleA，资源路径为xxx/a
 * 
 * 引用计数管理：
 * 1. 尽量使用此类的接口加载所有资源、instantiate节点实例，否则需要自行管理引用计数
 * 2. Res.instantiate不要对动态生成的节点使用，尽量只instantiate prefab上预设好的节点，否则有可能会导致引用计数的管理出错
 * 3. 调用load接口时如需传入release参数，则同一资源在全局调用load时release参数尽量保持一致，否则可能不符合预期
 * 4. 请使用ResSpine、ResSprite组件去动态加载spine、图片资源，否则需要自行管理这些资源的引用计数
 */
export default class Res {
    /** 节点与其关联的prefab路径 */
    private static _nodePath: Map<cc.Node, string> = new Map();
    /** prefab资源与路径 */
    private static _prefabPath: Map<cc.Prefab, string> = new Map();

    private static _prefabCache: Map<string, PrefabCacheData> = new Map();
    private static _spriteFrameCache: Map<string, CacheData> = new Map();
    private static _spriteAtlasCache: Map<string, CacheData> = new Map();
    private static _skeletonDataCache: Map<string, CacheData> = new Map();
    private static _otherCache: Map<string, cc.Asset> = new Map();

    /** 资源释放的间隔时间（秒），资源超过此间隔未被load才可释放 */
    public static releaseSec: number = 0;

    /**
     * 资源路径解析
     * @param url 
     */
    private static parseUrl(url: string): { bundle?: string, loadUrl: string } {
        if (url.startsWith(BUNDLE_CHECK)) {
            let loadUrl = url.substring(BUNDLE_CHECK.length);
            let idx = loadUrl.indexOf("/");
            let bundle = loadUrl.substring(0, idx);
            loadUrl = loadUrl.substring(idx + 1);
            return { bundle: bundle, loadUrl: loadUrl };
        } else {
            return { loadUrl: url };
        }
    }

    /**
     * 通过节点或预制查找已缓存prefab路径
     * @param target 
     */
    private static getCachePrefabUrl(target: cc.Node | cc.Prefab): string {
        let url = "";
        if (target instanceof cc.Node) {
            let cur = target;
            while (cur) {
                if (cur["_prefab"] && cur["_prefab"]["root"]) {
                    url = this._nodePath.get(cur["_prefab"]["root"]) || "";
                    if (url) {
                        break;
                    }
                }
                cur = cur.parent;
            }
        } else if (target instanceof cc.Prefab) {
            url = this._prefabPath.get(target) || "";
        }
        return url;
    }

    /**
     * 缓存资源
     * @param url 资源路径
     * @param asset 资源
     * @param release 资源是否需要释放
     */
    private static cacheAsset(url: string, asset: cc.Asset, release: boolean = true): void {
        if (!asset) {
            return;
        }

        let func = (map: Map<string, CacheData>) => {
            if (map.has(url)) {
                return;
            }
            asset.addRef();
            if (asset instanceof cc.Prefab) {
                this._prefabPath.set(asset, url);
            }
            let cacheData: CacheData = {
                asset: asset,
                release: release,
                lastLoadTime: Date.now() / 1000
            };
            map.set(url, cacheData);
        };

        if (asset instanceof cc.Prefab) {
            func(this._prefabCache);
        } else if (asset instanceof cc.SpriteFrame) {
            func(this._spriteFrameCache);
        } else if (asset instanceof cc.SpriteAtlas) {
            func(this._spriteAtlasCache);
        } else if (asset instanceof sp.SkeletonData) {
            func(this._skeletonDataCache);
        } else {
            if (this._otherCache.has(url)) {
                return;
            }
            asset.addRef();
            this._otherCache.set(url, asset);
        }
    }

    /**
     * 获取缓存资源。通常不应直接调用此接口，除非调用前能确保资源已加载并且能自行管理引用计数
     * @param url 资源路径
     * @param type 资源类型
     */
    public static get<T extends cc.Asset>(url: string, type: typeof cc.Asset): T | null {
        let asset: unknown = null;
        let func = (map: Map<string, CacheData>) => {
            let data = map.get(url);
            if (data) {
                asset = data.asset;
                data.lastLoadTime = Date.now() / 1000;
            }
        };

        if (type === cc.Prefab) {
            func(this._prefabCache);
        } else if (type === cc.SpriteFrame) {
            func(this._spriteFrameCache);
        } else if (type === cc.SpriteAtlas) {
            func(this._spriteAtlasCache);
        } else if (type === sp.SkeletonData) {
            func(this._skeletonDataCache);
        } else {
            asset = this._otherCache.get(url);
        }

        return asset as T;
    }

    /**
     * 加载bundle
     * @param nameOrUrl bundle路径
     */
    public static loadBundle(nameOrUrl: string): Promise<cc.AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadBundle(nameOrUrl, (error: Error, bundle: cc.AssetManager.Bundle) => {
                if (error) {
                    cc.error(`[Res.loadBundle] error: ${error}`);
                    resolve(null);
                } else {
                    resolve(bundle);
                }
            });
        });
    }

    /**
     * 加载单个资源
     * @param url 资源路径
     * @param type 资源类型
     * @param release 资源是否需要释放
     */
    public static async load<T extends cc.Asset>(url: string, type: typeof cc.Asset, release: boolean = true): Promise<T | null> {
        if (!url) {
            cc.error(`[Res.load] url is empty`);
            return null;
        }

        let asset: T = this.get(url, type);
        if (asset) {
            return asset;
        }

        let parseData = this.parseUrl(url);
        if (parseData.bundle && !cc.assetManager.getBundle(parseData.bundle)) {
            await this.loadBundle(parseData.bundle);
        }

        asset = await new Promise((resolve, reject) => {
            let bundle: cc.AssetManager.Bundle = parseData.bundle ? cc.assetManager.getBundle(parseData.bundle) : cc.resources;
            if (!bundle) {
                cc.error(`[Res.load] cant find bundle: ${url}`);
                resolve(null);
                return;
            }

            bundle.load(parseData.loadUrl, type, (error: Error, resource: T) => {
                if (error) {
                    cc.error(`[Res.load] load error: ${error}`);
                    resolve(null);
                } else {
                    this.cacheAsset(url, resource, release);
                    resolve(resource);
                }
            });
        });
        return asset;
    }

    /**
     * 加载某个文件夹内的某类资源
     * @param url 资源路径
     * @param type 资源类型
     * @param release 资源是否需要释放
     */
    public static async loadDir<T extends cc.Asset>(url: string, type: typeof cc.Asset, release: boolean = true): Promise<T[]> {
        if (!url) {
            cc.error(`[Res.load] url is empty`);
            return [];
        }

        let parseData = this.parseUrl(url);
        if (parseData.bundle && !cc.assetManager.getBundle(parseData.bundle)) {
            await this.loadBundle(parseData.bundle);
        }

        return new Promise((resolve, reject) => {
            let bundle: cc.AssetManager.Bundle = parseData.bundle ? cc.assetManager.getBundle(parseData.bundle) : cc.resources;
            if (!bundle) {
                cc.error(`[Res.loadDir] cant find bundle: ${url}`);
                resolve([]);
                return;
            }

            bundle.loadDir(parseData.loadUrl, type, (error: Error, resource: T[]) => {
                if (error) {
                    cc.error(`[Res.loadDir] load error: ${error}`);
                    resolve([]);
                } else {
                    let infos = bundle.getDirWithPath(url, type);
                    resource.forEach((asset, i) => { this.cacheAsset(infos[i].path, asset, release); });
                    resolve(resource);
                }
            });
        });
    }

    /**
     * 获取节点实例，并建立新节点与prefab资源的联系
     * @param original 用于实例化节点的prefab或node
     * @param related 如果original不是动态加载的prefab，则需传入与original相关联的动态加载的prefab或node，以便资源释放的管理
     * @example 
     * // 1.original为动态加载的prefab，无需传related参数
     * Res.instantiate(original)
     * 
     * // 2.aPrefab为动态加载的prefab，aNode为aPrefab的实例节点（aNode = Res.instantiate(aPrefab)），original为被aPrefab静态引用的prefab，则调用时需要用如下方式才能保证引用关系正确
     * Res.instantiate(original, aPrefab)
     * Res.instantiate(original, aNode)
     * 
     * // 3.aPrefab为动态加载的prefab，aNode为aPrefab的实例节点（aNode = Res.instantiate(aPrefab)），original为aNode的某个子节点，则如下方式均可保证引用关系正确
     * Res.instantiate(original)
     * Res.instantiate(original, aPrefab)
     * Res.instantiate(original, aNode)
     */
    public static instantiate(original: cc.Node | cc.Prefab, related?: cc.Node | cc.Prefab): cc.Node {
        if (!original) {
            cc.error("[Res.instantiate] original is null");
            return null;
        }

        let node = cc.instantiate(original) as cc.Node;
        let url = this.getCachePrefabUrl(related) || this.getCachePrefabUrl(original);
        if (url) {
            let cacheData: PrefabCacheData = this._prefabCache.get(url);
            // release为true才缓存关联节点
            if (cacheData && cacheData.release) {
                if (!Array.isArray(cacheData.nodes)) {
                    cacheData.nodes = [];
                }
                cacheData.nodes.push(node);
                this._nodePath.set(node, url);
            }
        }
        return node;
    }

    /**
     * 尝试释放所有缓存资源
     * - 只要遵守本文件的规则注释，此接口不会导致正在被使用的资源被引擎释放，可放心使用
     */
    public static releaseAll(): void {
        let nowSec = Date.now() / 1000;
        // prefab
        this._prefabCache.forEach((cacheData, url) => {
            if (!cacheData.release || nowSec - cacheData.lastLoadTime < this.releaseSec) {
                return;
            }

            if (Array.isArray(cacheData.nodes)) {
                for (let i = cacheData.nodes.length - 1; i >= 0; i--) {
                    let node = cacheData.nodes[i];
                    if (node.isValid) {
                        continue;
                    }
                    this._nodePath.delete(node);
                    cacheData.nodes.splice(i, 1);
                }
                if (cacheData.nodes.length === 0) {
                    delete cacheData.nodes;
                }
            }

            if (!Array.isArray(cacheData.nodes)) {
                cacheData.asset.decRef();
                this._prefabPath.delete(cacheData.asset as cc.Prefab);
                this._prefabCache.delete(url);
            }
        });
        // spriteFrame、spriteAtlas、skeletonData
        let arr = [this._spriteFrameCache, this._spriteAtlasCache, this._skeletonDataCache];
        arr.forEach((map) => {
            map.forEach((cacheData, url) => {
                if (!cacheData.release || nowSec - cacheData.lastLoadTime < this.releaseSec) {
                    return;
                }
                cacheData.asset.decRef();
                map.delete(url);
            });
        });
        // other
    }
}
