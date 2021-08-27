const { ccclass, property, disallowMultiple } = cc._decorator;

/**
 * 虚拟列表的元素组件
 */
@ccclass
@disallowMultiple
export default class VirtualItem extends cc.Component {
    /** 列表数据索引 */
    public DataIdx: number = 0;

    /**
     * 根据数据初始化item信息
     * - 需通过VirtualList去调用，一般不能主动调用
     * @virtual
     */
    public onInit(...args: any[]) {
    }

    /**
     * 在onInit之后调用，参数为分层显示的节点，参数顺序为Others数组的顺序
     * @virtual
     */
    public setOtherNode(...nodes: cc.Node[]) {
    }

    /**
     * 回收item时重置内部状态
     * @virtual
     */
    public onReset() {
    }

    /**
     * 获取item显示当前数据所需的真实大小（若节点size会根据数据改变，请在此函数内返回准确的size）
     * @virtual
     */
    public getRealSize(): cc.Size {
        return this.node.getContentSize();
    }
}
