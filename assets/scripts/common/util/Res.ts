/**
 * 资源管理类
 */
export default class Res {
    /**
     * 获取已经预加载的资源。调用前需确保资源已预加载
     * @param url 资源路径
     */
    public static get<T extends cc.Asset>(url: string, type?: typeof cc.Asset): T {
        let asset: T = cc.resources.get(url, type);
        if (!asset) {
            cc.error(`[Res.get] error: 资源未加载 url: ${url}`);
            return null;
        }

        return asset;
    }

    /**
     * 加载resources文件夹下单个资源
     * @param url 资源路径
     * @param type 资源类型
     */
    public static async load<T extends cc.Asset>(url: string, type: typeof cc.Asset): Promise<T> {
        let asset: T = cc.resources.get(url, type);
        if (asset) {
            return asset;
        }

        asset = await new Promise((resolve, reject) => {
            cc.resources.load(url, type, (error: Error, resource: T) => {
                if (error) {
                    cc.error(`[Res.load] error: ${error}`);
                    resolve(null);
                } else {
                    resolve(resource);
                }
            });
        });
        return asset;
    }

    /**
     * 加载resources文件夹下某个文件夹内全部资源
     * @param url 资源路径
     * @param type 资源类型
     */
    public static loadDir<T extends cc.Asset>(url: string, type: typeof cc.Asset): Promise<T[]> {
        return new Promise((resolve, reject) => {
            cc.resources.loadDir(url, type, (error: Error, resource: T[]) => {
                if (error) {
                    cc.error(`[Res.loadDir] error: ${error}`);
                    resolve([]);
                } else {
                    resolve(resource);
                }
            });
        });
    }

    /**
     * 释放所有动态加载的资源，需要注意调用时机
     */
    public static clear() {
        cc.resources.releaseAll();
    }
}
