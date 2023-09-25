/** 资源缓存基础数据结构 */
interface CacheData {
    asset: cc.Asset;
    /** 资源是否需要释放 */
    release: boolean;
    /** 资源最后一次被加载的时间点（秒） */
    lastLoadTime: number;
    /** 对资源有引用的对象 */
    objs?: cc.Object[];
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
 * 2. 调用load接口时如需传入release参数，则同一资源在全局调用load时release参数尽量保持一致，否则可能不符合预期
 * 3. Res.instantiate不要对动态生成的节点使用，尽量只instantiate prefab上预设好的节点，否则有可能会导致引用计数的管理出错
 * 4. 请使用ResSpine、ResSprite组件去动态加载spine、图片资源，否则需要自行管理这些资源的引用计数
 */
export default class Res {
    /** prefab资源与路径 */
    private static _prefabPath: Map<cc.Prefab, string> = new Map();
    /** 对资源有引用的对象实例与资源路径 */
    private static _objPath: Map<cc.Object, string> = new Map();
    /** 资源缓存 */
    private static _assetCache: Map<typeof cc.Asset, Map<string, CacheData>> = new Map();
    /** 对象池 */
    private static _dataPool: CacheData[] = [];

    /** 资源释放的间隔时间（秒），资源超过此间隔未被load/get才可释放 */
    public static releaseSec: number = 120;

    /**
     * 获取新的CacheData
     */
    private static getCacheData(asset: cc.Asset, release: boolean): CacheData {
        let cacheData: CacheData = null;
        if (this._dataPool.length > 0) {
            cacheData = this._dataPool.pop();
        } else {
            cacheData = {
                asset: null,
                release: false,
                lastLoadTime: 0
            };
        }
        cacheData.asset = asset;
        cacheData.release = release;
        cacheData.lastLoadTime = Date.now() / 1000;
        return cacheData;
    }

    /**
     * 回收CacheData
     */
    private static putCacheData(data: CacheData): void {
        data.asset = null;
        this._dataPool.push(data);
    }

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
                    url = this._objPath.get(cur["_prefab"]["root"]) || "";
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
    private static cacheAsset(url: string, asset: cc.Asset, type: typeof cc.Asset, release: boolean = true): void {
        if (!asset) {
            return;
        }

        let map: Map<string, CacheData> = this._assetCache.get(type);
        if (!map) {
            map = new Map();
            this._assetCache.set(type, map);
        }
        if (map.has(url)) {
            return;
        }

        asset.addRef();
        let cacheData: CacheData = this.getCacheData(asset, release);
        map.set(url, cacheData);
        // prefab资源额外记录
        if (asset instanceof cc.Prefab) {
            this._prefabPath.set(asset, url);
        }
    }

    /**
     * 记录对资源有引用的对象
     */
    private static writeObject(url: string, type: typeof cc.Asset, obj: cc.Object): void {
        let cacheMap: Map<string, CacheData> = this._assetCache.get(type);
        if (!cacheMap) {
            cc.error(`[Res.writeObject] cacheMap is null, url: ${url}`);
            return;
        }

        // 清理之前的记录
        let oldUrl = this._objPath.get(obj);
        if (oldUrl) {
            let oldData = cacheMap.get(oldUrl);
            if (oldData && Array.isArray(oldData.objs)) {
                let idx = oldData.objs.findIndex(v => v === obj);
                if (idx >= 0) {
                    oldData.objs.splice(idx, 1);
                }
            }
        }

        // 记录对象, release为true时才进行记录
        let cacheData = cacheMap.get(url);
        if (!cacheData) {
            cc.error(`[Res.writeObject] cacheData is null, url: ${url}`);
            return;
        }
        if (!cacheData.release) {
            return;
        }
        if (!Array.isArray(cacheData.objs)) {
            cacheData.objs = [];
        }
        cacheData.objs.push(obj);
        this._objPath.set(obj, url);
    }

    /**
     * 获取缓存资源
     * - 通常不应直接调用此接口，除非调用前能确保资源已加载并且能自行管理引用计数
     * @param url 资源路径
     * @param type 资源类型
     */
    public static get<T extends cc.Asset>(url: string, type: typeof cc.Asset): T | null {
        let asset: unknown = null;
        let map: Map<string, CacheData> = this._assetCache.get(type);
        if (map) {
            let data = map.get(url);
            if (data) {
                asset = data.asset;
                data.lastLoadTime = Date.now() / 1000;
            }
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
                    this.cacheAsset(url, resource, type, release);
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
                    resource.forEach((asset, i) => {
                        let cachePath = parseData.bundle ? `ab:${parseData.bundle}/${infos[i].path}` : infos[i].path;
                        this.cacheAsset(cachePath, asset, type, release);
                    });
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
            this.writeObject(url, cc.Prefab, node);
        }
        return node;
    }

    /**
     * 尝试释放所有缓存资源
     * - 只要遵守本文件的规则注释，此接口不会导致正在被使用的资源被引擎释放，可放心使用
     */
    public static releaseAll(): void {
        let nowSec = Date.now() / 1000;
        this._assetCache.forEach((map, type) => {
            map.forEach((cacheData, url) => {
                if (!cacheData.release || nowSec - cacheData.lastLoadTime < this.releaseSec) {
                    return;
                }

                if (Array.isArray(cacheData.objs)) {
                    for (let i = cacheData.objs.length - 1; i >= 0; i--) {
                        let obj = cacheData.objs[i];
                        if (obj.isValid) {
                            continue;
                        }
                        this._objPath.delete(obj);
                        cacheData.objs.splice(i, 1);
                    }
                    if (cacheData.objs.length === 0) {
                        delete cacheData.objs;
                    }
                }

                if (!Array.isArray(cacheData.objs)) {
                    cacheData.asset.decRef();
                    map.delete(url);
                    this.putCacheData(cacheData);
                    // 删除缓存时prefab资源额外记录的数据
                    if (type === cc.Prefab) {
                        this._prefabPath.delete(cacheData.asset as cc.Prefab);
                    }
                }
            });
        });
    }

    /**
     * 获取resources包内资源打包后的真实路径
     * @param url resources下的资源路径
     * @param ext 资源的后缀名
     * @param isNative true:返回打包后native目录下的路径，false:返回打包后import目录下的路径
     */
    public static getNativeUrlByResources(url: string, ext: string, isNative: boolean = true): string {
        try {
            let nativeUrl = cc.assetManager["_transform"]({ path: url, bundle: cc.AssetManager.BuiltinBundleName.RESOURCES, __isNative__: isNative, ext: ext });
            return nativeUrl;
        } catch (error) {
            cc.error(`[Res.getNativeUrlByResources] error url: ${url}`);
            return "";
        }
    }
}
