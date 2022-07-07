import Res from "../../util/Res";

const { ccclass, property, requireComponent, disallowMultiple, menu } = cc._decorator;

/** 列表元素模板类型 */
enum TemplateType {
    NODE,
    PREFAB
}

/**
 * 无限循环列表(轮播图)
 */
@ccclass
@disallowMultiple
@requireComponent(cc.PageView)
@menu('Framework/UI组件/CircleList')
export default class CircleList extends cc.Component {
    /** item刷新事件 */
    public static ITEM_REFRESH: string = 'circleList-itemRefresh';

    @property({
        type: cc.Enum(TemplateType),
        tooltip: CC_DEV && '列表元素模板类型'
    })
    public templateType: TemplateType = TemplateType.PREFAB;

    @property({
        type: cc.Prefab,
        tooltip: CC_DEV && '列表元素模板预制体',
        visible() { return this.templateType === TemplateType.PREFAB; }
    })
    public templatePrefab: cc.Prefab = null;

    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表元素模板节点',
        visible() { return this.templateType === TemplateType.NODE; }
    })
    public templateNode: cc.Node = null;

    private _firstDirty: boolean = false;
    private _refreshDirty: boolean = false;
    /** 当前显示的数据下标 */
    private _curIdx = 0;
    /** 所有item的中间节点下标 */
    private _midIdx = 2;
    /** 实际需显示的数据长度 */
    private _dataLen = 0;
    private _refreshCall: (node: cc.Node, idx: number, isCur: boolean) => void = null;
    private _target: any = null;

    private _pageView: cc.PageView = null;
    public get pageView(): cc.PageView {
        if (!this._pageView) {
            this._pageView = this.getComponent(cc.PageView);
        }
        return this._pageView;
    }

    public get view(): cc.Node { return this.pageView.content.parent; }

    protected start(): void {
        // 注册事件
        this.node.on('scroll-ended', this.onScrollEnd, this);
    }

    protected lateUpdate(): void {
        if (this.pageView.getPages().length === 0) {
            return;
        }
        if (this._firstDirty) {
            this._firstDirty = false;
            this.pageView.setContentPosition(cc.v2(-this.view.width / 2 - this._midIdx * this.view.width, 0));
            this.pageView.setCurrentPageIndex(this._midIdx);
        }
        if (this._refreshDirty) {
            this._refreshDirty = false;
            this.refresh();
        }
    }

    /**
     * 初始化循环列表
     * @param length 数据长度
     * @param curIdx 初始显示的数据
     * @param refreshCall 每个item刷新时的回调
     * @param target
     */
    public onInit(length: number, curIdx: number, refreshCall: (node: cc.Node, idx: number, isCur: boolean) => void, target: any): void {
        this._dataLen = length;
        this._curIdx = cc.misc.clampf(curIdx, 0, this._dataLen - 1);
        this._refreshCall = refreshCall;
        this._target = target;
        this._firstDirty = true;
        this._refreshDirty = true;

        // 生成节点
        if (this.pageView.getPages().length === 0) {
            let tmp: any = this.templateType === TemplateType.PREFAB ? this.templatePrefab : this.templateNode;
            for (let i = 0; i < 5; i++) {
                let node = Res.instantiate(tmp, this.node);
                node.active = true;
                node.setPosition(0, 0);
                this.pageView.addPage(node);
            }
            this.pageView.content.getComponent(cc.Layout).updateLayout();
        }
    }

    /**
     * 重置数据长度与当前显示的数据下标
     */
    public resetData(length: number, curIdx: number = null): void {
        this._dataLen = length;
        this._curIdx = cc.misc.clampf(curIdx === null ? this._curIdx : curIdx, 0, this._dataLen - 1);
        this._refreshDirty = true;
    }

    /**
     * 根据下标设置当前显示的数据
     */
    public setCurIdx(curIdx: number): void {
        this._curIdx = curIdx;
        this._refreshDirty = true;
    }

    private onScrollEnd(): void {
        let cur = this.pageView.getCurrentPageIndex();
        if (cur === this._midIdx) {
            return;
        }
        this.pageView.setContentPosition(cc.v2(-this.view.width / 2 - this._midIdx * this.view.width, 0));
        this.pageView.setCurrentPageIndex(this._midIdx);
        this._curIdx += cur - this._midIdx;
        while (this._curIdx < 0) {
            this._curIdx += this._dataLen;
        }
        while (this._curIdx > this._dataLen - 1) {
            this._curIdx -= this._dataLen;
        }
        this._refreshDirty = true;
    }

    private refresh(): void {
        this.pageView.content.children.forEach((item, index) => {
            let i = this._curIdx - (this._midIdx - index);
            while (i < 0) {
                i += this._dataLen;
            }
            while (i > this._dataLen - 1) {
                i -= this._dataLen;
            }

            if (this._refreshCall) {
                this._refreshCall.call(this._target, item, i, i === this._curIdx);
            }
        });
    }
}
