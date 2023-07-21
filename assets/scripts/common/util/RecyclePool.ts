/**
 * 用于使用节点池的节点所绑定脚本组件实现
 */
export interface RecycleNode {
    /** 回收前调用 */
    unuse(): void;
    /** 取出前调用 */
    reuse(): void;
}

/**
 * 节点池
 */
export default class RecyclePool {
    /** 以url标记的节点池 */
    private static _urlMap: Map<string, cc.Node[]> = new Map();
    /** 以cccomponent标记的节点池，需要实现接口RecycleNode */
    private static _cmptMap: Map<{ prototype: cc.Component }, cc.Node[]> = new Map();

    /** 单个节点池的最大节点数量 */
    public static limit: number = 512;

    /**
     * 获取节点池中节点数量
     */
    public static size(key: string | { prototype: cc.Component }): number {
        let list = typeof key === "string" ? this._urlMap.get(key) : this._cmptMap.get(key);
        if (list === undefined) {
            return 0;
        }

        return list.length;
    }

    /**
     * 清空节点
     */
    public static clear(key: string | { prototype: cc.Component }): void {
        if (typeof key === "string") {
            let list = this._urlMap.get(key);
            if (list === undefined) {
                return;
            }

            let count = list.length;
            for (let i = 0; i < count; ++i) {
                list[i].destroy();
            }
            list.length = 0;
            this._urlMap.delete(key);
        } else {
            let list = this._cmptMap.get(key);
            if (list === undefined) {
                return;
            }

            let count = list.length;
            for (let i = 0; i < count; ++i) {
                list[i].destroy();
            }
            list.length = 0;
            this._cmptMap.delete(key);
        }
    }

    /**
     * 清空全部节点
     */
    public static clearAll(): void {
        this._urlMap.forEach((list: cc.Node[]) => {
            let count = list.length;
            for (let i = 0; i < count; ++i) {
                list[i].destroy();
            }
        });
        this._urlMap.clear();

        this._cmptMap.forEach((list: cc.Node[]) => {
            let count = list.length;
            for (let i = 0; i < count; ++i) {
                list[i].destroy();
            }
        });
        this._cmptMap.clear();
    }

    /**
     * 根据类型从节点池取出节点
     */
    public static get(key: string | { prototype: cc.Component }): cc.Node | null {
        if (typeof key === "string") {
            let list = this._urlMap.get(key);
            if (list === undefined || list.length <= 0) {
                return null;
            }

            let last = list.length - 1;
            let node = list[last];
            list.length = last;
            return node;
        } else {
            let list = this._cmptMap.get(key);
            if (list === undefined || list.length <= 0) {
                return null;
            }

            let last = list.length - 1;
            let node = list[last];
            list.length = last;
            // Invoke pool handler
            let handler: any = node.getComponent(key);
            if (handler && handler.reuse) {
                handler.reuse();
            }
            return node;
        }
    }

    /**
     * 根据类型将节点放入节点池
     */
    public static put(key: string | { prototype: cc.Component }, node: cc.Node): void {
        if (!node) {
            cc.error(`[RecyclePool.put] error: 传入节点为空`);
            return;
        }

        if (typeof key === "string") {
            let list = this._urlMap.get(key);
            if (list === undefined) {
                list = [];
                this._urlMap.set(key, list);
            } else if (list.indexOf(node) !== -1) {
                cc.error(`[RecyclePool.put] error: 不可将节点重复放入节点池中`);
                return;
            } else if (list.length >= RecyclePool.limit) {
                node.destroy();
                cc.warn(`[RecyclePool.put] warn: 节点池到达最大数量 key: ${key}`);
                return;
            }

            node.removeFromParent(false);
            list.push(node);
        } else {
            let list = this._cmptMap.get(key);
            if (list === undefined) {
                list = [];
                this._cmptMap.set(key, list);
            } else if (list.indexOf(node) !== -1) {
                cc.error(`[RecyclePool.put] error: 不可将节点重复放入节点池中`);
                return;
            } else if (list.length >= RecyclePool.limit) {
                node.destroy();
                cc.warn(`[RecyclePool.put] warn: 节点池到达最大数量 key: ${key}`);
                return;
            }

            node.removeFromParent(false);
            // Invoke pool handler
            let handler: any = node.getComponent(key);
            if (handler && handler.unuse) {
                handler.unuse();
            }
            list.push(node);
        }
    }
}
