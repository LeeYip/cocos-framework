import Tool from "../../../util/Tool";

const { ccclass, property, executeInEditMode, menu } = cc._decorator;

/** 初始角度 */
const INIT_DEGREE: number = 270;

/**
 * 环形列表，将节点以椭圆排列
 */
@ccclass
@executeInEditMode
@menu("Framework/UI组件/CircleList")
export default class CircleList extends cc.Component {
    @property(cc.Node)
    private content: cc.Node = null;
    @property({ tooltip: CC_DEV && "椭圆长短轴" })
    private ellipseAxes: cc.Vec2 = cc.v2(0, 0);
    @property({ tooltip: CC_DEV && "列表自动滚动的速度" })
    private scrollSpeed: number = 200;

    private _init: boolean = false;
    private _curDegree: number = INIT_DEGREE;
    private _targetDegree: number = INIT_DEGREE;
    private _scrolling: boolean = false;
    private _itemDegreeMap: Map<cc.Node, number> = new Map();
    private _maxDelta: number = 0;
    /** 子节点被选中时的回调 */
    private _selectCall: (item: cc.Node) => void = null;

    /** 虚拟角度，子节点会根据角度计算坐标 */
    public get curDegree(): number { return this._curDegree; }
    public set curDegree(v: number) {
        this._curDegree = Tool.normalizeDegree(v);
        this.refreshItems();
    }

    /**
     * 初始化列表，按角度均匀排列content所有子节点
     * @param selectCall 
     */
    public init(selectCall: (item: cc.Node) => void = null): void {
        this._init = true;
        this._scrolling = false;
        this._maxDelta = 0;
        this._itemDegreeMap.clear();
        this._selectCall = selectCall;
        if (this.content.childrenCount <= 0) {
            return;
        }
        let average: number = 360 / this.content.childrenCount;
        this.content.children.forEach((v, i) => {
            this._itemDegreeMap.set(v, i * average);

            v.on(cc.Node.EventType.TOUCH_MOVE, this.itemTouchMove, this);
            v.on(cc.Node.EventType.TOUCH_END, this.itemTouchEnd, this);
            v.on(cc.Node.EventType.TOUCH_CANCEL, this.itemTouchEnd, this);
        });
        this.refreshItems();
    }

    /**
     * 滚动到指定子节点处
     * @param item 子节点
     */
    public scrollToItem(item: cc.Node): void {
        if (!this._itemDegreeMap.has(item)) {
            return;
        }

        let itemDegree = this._itemDegreeMap.get(item);
        let delta = INIT_DEGREE - itemDegree;
        this._targetDegree = Tool.normalizeDegree(delta);
        this._scrolling = true;
        this._selectCall?.(item);
    }

    private refreshItems(): void {
        this.content.children.forEach((v, i) => {
            let degree = Tool.normalizeDegree(this._itemDegreeMap.get(v) + this.curDegree);
            let pos = Tool.getEllipsePoint(this.ellipseAxes.x, this.ellipseAxes.y, degree);
            v.setPosition(pos);
            v.zIndex = -v.y;
        });
    }

    protected update(dt: number): void {
        if (!this._init || !this._scrolling || this.curDegree === this._targetDegree) {
            return;
        }

        let delta = Math.abs(this._targetDegree - this.curDegree);
        let degree = this.curDegree;
        let sign = (delta < 180 ? 1 : -1) * Math.sign(this._targetDegree - this.curDegree);
        degree += dt * this.scrollSpeed * sign;

        if ((this.curDegree > this._targetDegree && degree < this._targetDegree) || (this.curDegree < this._targetDegree && degree > this._targetDegree)) {
            degree = this._targetDegree;
            this._scrolling = false;
        }
        this.curDegree = degree;
    }

    private itemTouchMove(event: cc.Event.EventTouch): void {
        let delta = event.getDeltaX();
        if (Math.abs(delta) < 1) {
            return;
        }

        if (this._maxDelta < Math.abs(delta)) {
            this._maxDelta = Math.abs(delta);
        }
        this.curDegree = this.curDegree + delta / 5;
    }

    private itemTouchEnd(event: cc.Event.EventTouch): void {
        let node = event.target;
        if (this._maxDelta < 5) {
            this._maxDelta = 0;
            this.scrollToItem(node);
            return;
        }

        let minDelta = 360;
        let minNode = this.content.children[0];
        for (let i = 0; i < this.content.children.length; i++) {
            const item = this.content.children[i];
            let itemDegree = Tool.normalizeDegree(this._itemDegreeMap.get(item) + this.curDegree);
            let delta = Math.abs(INIT_DEGREE - itemDegree);
            if (delta > 180) {
                delta = itemDegree + 360 - INIT_DEGREE;
            }
            if (delta < minDelta) {
                minDelta = delta;
                minNode = item;
            }
        }
        this._maxDelta = 0;
        this.scrollToItem(minNode);
    }
}
