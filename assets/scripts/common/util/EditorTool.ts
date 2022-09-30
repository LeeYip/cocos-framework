/**
 * 编辑器工具类
 */
export default class EditorTool {
    /**
     * 编辑器模式下加载资源
     * @param url db://assets/
     */
    public static load<T>(url: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (!CC_EDITOR) {
                resolve(null);
                return;
            }
            Editor.assetdb.queryUuidByUrl(`db://assets/${url}`, (error: any, uuid: string) => {
                if (error || !uuid) {
                    resolve(null);
                    cc.warn(`[EditorTool.load] uuid查询失败 url: ${url}`);
                    return;
                }
                //@ts-ignore
                cc.resources.load({ type: "uuid", uuid: uuid }, (error: any, result: T) => {
                    if (error || !result) {
                        resolve(null);
                        cc.warn(`[EditorTool.load] 资源加载失败 url: ${url}`);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }

    /**
     * 编辑器模式下设置ccclass的属性装饰器中的枚举值
     */
    public static setClassAttrPropEnum(ctor: unknown, propName: string, value: unknown): void {
        if (!CC_EDITOR) {
            return;
        }
        cc.Class["Attr"].setClassAttr(ctor, propName, "enumList", value);
    }

    /**
     * 编辑器模式下刷新选中节点的属性检查器窗口
     * @param node 选中的节点
     */
    public static refreshSelectedInspector(node: cc.Node): void {
        if (!CC_EDITOR) {
            return;
        }
        Editor.Utils.refreshSelectedInspector("node", node.uuid);
    }
}
