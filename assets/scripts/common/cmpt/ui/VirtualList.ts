import VirtualLayout from "./VirtualLayout";

const { ccclass, property, requireComponent, executeInEditMode, disallowMultiple, menu } = cc._decorator;

/**
 * 列表元素模板类型
 */
export enum TemplateType {
    NODE,
    PREFAB
}

/**
 * 虚拟列表容器以及容器内元素的模板数据
 */
@ccclass('VirtualLayoutData')
export class VirtualLayoutData {
    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表容器节点',
        visible() { return !this._isMain; }
    })
    public Content: cc.Node = null;

    @property({
        type: cc.Enum(TemplateType),
        tooltip: CC_DEV && '列表元素模板类型'
    })
    public TemplateType: TemplateType = TemplateType.PREFAB;

    @property({
        type: cc.Prefab,
        tooltip: CC_DEV && '列表元素模板预制体',
        visible() { return this.TemplateType === TemplateType.PREFAB; }
    })
    public TemplatePrefab: cc.Prefab = null;

    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表元素模板节点',
        visible() { return this.TemplateType === TemplateType.NODE; }
    })
    public TemplateNode: cc.Node = null;

    @property(cc.Boolean) public _isMain: boolean = false;
}

/**
 * 虚拟列表
 */
@ccclass
@disallowMultiple
@executeInEditMode
@requireComponent(cc.ScrollView)
@menu('Framework/UI组件/VirtualList')
export default class VirtualList extends cc.Component {
    @property({ type: VirtualLayoutData, tooltip: CC_DEV && '列表主容器' })
    public Main: VirtualLayoutData = new VirtualLayoutData();

    @property({ type: VirtualLayoutData, tooltip: CC_DEV && '列表除主容器外的其他容器\n需要分层显示时使用，一般用于降低draw call' })
    public Others: VirtualLayoutData[] = [];

    @property({ 
        visible: false,
        tooltip: CC_DEV && '元素节点大小是否一致且固定不变，大小不定时更耗性能（目前不支持此选项，必须为true）'
     })
    public IsFixedSize: boolean = true;

    private _scrollView: cc.ScrollView = null;
    private _layout: VirtualLayout = null;

    protected onLoad() {
        if (CC_EDITOR) {
            this._runEditor();
            return;
        }

        this._scrollView = this.getComponent(cc.ScrollView);
        this._layout = this._scrollView.content.getComponent(VirtualLayout);
        if (this._layout) {
            this._layout.list = this;
            this._layout.onInit();
        }
    }

    protected resetInEditor() {
        if (CC_EDITOR) {
            this._runEditor();
            return;
        }
    }

    /**
     * 编辑器模式下的一些设置
     */
    private _runEditor() {
        let scrollView = this.getComponent(cc.ScrollView);
        let layout = scrollView.content.getComponent(VirtualLayout);

        if (!this.Main.Content) {
            this.Main.Content = scrollView.content;
            this.Main._isMain = true;
        }
        if (!layout) {
            scrollView.content.addComponent(VirtualLayout);
        }
    }

    /**
     * 滚动元素节点到view的指定位置
     * @param idx 元素下标
     * @param itemAnchor 元素的锚点位置（左下角为0点）
     * @param viewAnchor view的锚点位置（左下角为0点）
     * @param t 时间 s
     * @param a 加速度是否衰减，为true且滚动距离大时滚动会不准确
     */
    public scrollItemToView(idx: number, itemAnchor: cc.Vec2 = cc.v2(), viewAnchor: cc.Vec2 = cc.v2(), t: number = 0, a: boolean = true) {
        this._scrollView.scrollToOffset(this._layout.getScrollOffset(idx, itemAnchor, viewAnchor), t, a);
    }

    /**
     * 获取列表数据
     */
    public getDataArr() {
        return this._layout.dataArr;
    }

    /**
     * 重置某个元素数据
     * @param index 
     * @param args 元素所需参数
     */
    public reset(index: number, ...args: any[]) {
        this._layout.reset(index, ...args);
    }

    /**
     * 添加元素数据到尾部
     * @param args 元素所需参数
     */
    public push(...args: any[]) {
        this._layout.push(...args);
    }

    /**
     * 删除尾部元素数据
     */
    public pop() {
        this._layout.pop();
    }

    /**
     * 添加元素数据到头部
     * @param args 
     */
    public unshift(...args: any[]) {
        this._layout.unshift();
    }

    /**
     * 删除头部元素数据
     */
    public shift() {
        this._layout.shift();
    }

    /**
     * 插入或删除元素 用法同数组splice
     */
    public splice(start: number, deleteCount?: number, ...argsArr: any[][]) {
        this._layout.splice(start, deleteCount, ...argsArr);
    }

    /**
     * 数据排序
     * @param call 
     */
    public sort(call: (a: any[], b: any[]) => number) {
        this._layout.sort(call);
    }
}
