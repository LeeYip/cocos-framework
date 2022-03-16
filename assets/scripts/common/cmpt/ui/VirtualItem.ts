import { VirtualArgs } from "./VirtualList";

const { ccclass, disallowMultiple } = cc._decorator;

/**
 * 虚拟列表的元素组件
 */
@ccclass
@disallowMultiple
export default class VirtualItem<T extends VirtualArgs> extends cc.Component {
    /** 列表数据索引 */
    public dataIdx: number = 0;
    /** 列表数据 */
    public args: T = null;
    /** 分层的其余节点，顺序为Others数组的顺序 */
    public others: cc.Node[] = [];

    /**
     * 根据数据刷新item显示
     * @virtual
     */
    public onRefresh(args: T): void {
    }

    /**
     * 在onRefresh之后调用，参数为分层显示的节点，参数顺序为Others数组的顺序
     * @virtual
     */
    public onRefreshOthers(...nodes: cc.Node[]): void {
    }

    /**
     * 回收item时重置内部状态
     * @virtual
     */
    public onReset(): void {
    }

    /**
     * 获取item显示当前数据所需的真实大小（若节点size会根据数据改变，请在此函数内返回准确的size）
     * @virtual
     */
    public getRealSize(): cc.Size {
        return this.node.getContentSize();
    }
}
