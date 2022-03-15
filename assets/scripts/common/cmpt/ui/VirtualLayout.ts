import Res from "../../util/Res";
import Tool from "../../util/Tool";
import VirtualItem from "./VirtualItem";
import VirtualList, { MainTemplateType, OtherTemplateType, VirtualArgs } from "./VirtualList";

const { ccclass, property, disallowMultiple } = cc._decorator;

/**
 * 布局模式
 */
enum LayoutType {
    /** 横向 */
    HORIZONTAL,
    /** 纵向 */
    VERTICAL,
    /** 网格 */
    GRID
}

/**
 * 布局轴向，只用于GRID布局。
 */
enum AxisDirection {
    HORIZONTAL,
    VERTICAL
}

/**
 * 横向排列方向
 */
enum HorizontalDirection {
    LEFT_TO_RIGHT,
    RIGHT_TO_LEFT
}

/**
 * 纵向排列方向
 */
enum VerticalDirection {
    TOP_TO_BOTTOM,
    BOTTOM_TO_TOP
}

/**
 * 虚拟列表所需的布局组件
 */
@ccclass
@disallowMultiple
export default class VirtualLayout<T extends VirtualArgs> extends cc.Component {
    @property({ type: cc.Enum(LayoutType), tooltip: CC_DEV && '布局模式' })
    public Type: LayoutType = LayoutType.VERTICAL;

    @property({
        type: cc.Enum(AxisDirection),
        tooltip: CC_DEV && 'GRID布局的起始轴方向\nHORIZONTAL：固定宽度，动态改变高度\nVERTICAL：固定高度，动态改变宽度',
        visible() { return this.Type === LayoutType.GRID; }
    })
    public StartAxis: AxisDirection = AxisDirection.HORIZONTAL;

    @property({ visible() { return this.Type === LayoutType.HORIZONTAL || this.Type === LayoutType.GRID; } })
    public Left: number = 0;

    @property({ visible() { return this.Type === LayoutType.HORIZONTAL || this.Type === LayoutType.GRID; } })
    public Right: number = 0;

    @property({ visible() { return this.Type === LayoutType.VERTICAL || this.Type === LayoutType.GRID; } })
    public Top: number = 0;

    @property({ visible() { return this.Type === LayoutType.VERTICAL || this.Type === LayoutType.GRID; } })
    public Bottom: number = 0;

    @property({ visible() { return this.Type === LayoutType.HORIZONTAL || this.Type === LayoutType.GRID; } })
    public SpacingX: number = 0;

    @property({ visible() { return this.Type === LayoutType.VERTICAL || this.Type === LayoutType.GRID; } })
    public SpacingY: number = 0;

    @property({
        type: cc.Enum(VerticalDirection),
        visible() { return this.Type === LayoutType.VERTICAL || this.Type === LayoutType.GRID; }
    })
    public VerticalDirection: VerticalDirection = VerticalDirection.TOP_TO_BOTTOM;

    @property({
        type: cc.Enum(HorizontalDirection),
        visible() { return this.Type === LayoutType.HORIZONTAL || this.Type === LayoutType.GRID; }
    })
    public HorizontalDirection: HorizontalDirection = HorizontalDirection.LEFT_TO_RIGHT;

    /** mask节点（content父节点） */
    private _view: cc.Node = null;
    /** view坐标系下view的边界矩形 */
    private _viewEdge: cc.Rect = null;
    /** 元素节点大小固定时的size */
    private _fixedSize: cc.Size = null;
    /** 标记当前帧是否需要更新content size */
    private _sizeDirty: boolean = false;
    /** 标记当前帧是否需要更新view区域数据显示 */
    private _viewDirty: boolean = false;
    /** main content激活状态的item */
    private _items: cc.Node[] = [];
    /** main content被回收的item池（不移出节点树，只设置active） */
    private _itemPool: cc.Node[] = [];
    /** others content激活状态的item，下标顺序与this.list.Others数组一致 */
    private _otherItemsArr: cc.Node[][] = [];
    /** others content被回收的item池（不移出节点树，只设置active），下标顺序与this.list.Others数组一致 */
    private _otherItemPoolArr: cc.Node[][] = [];

    /** 所属虚拟列表 */
    public list: VirtualList<T> = null;
    /** 列表缓存的所有数据 */
    public dataArr: T[] = [];

    public onInit(): void {
        this._view = this.node.parent;
        this._viewEdge = this.getNodeEdgeRect(this._view);

        // 初始化分层相关数据
        this._otherItemsArr = [];
        this._otherItemPoolArr = [];
        this.list.Others.forEach((e) => {
            this._otherItemsArr.push([]);
            this._otherItemPoolArr.push([]);
        });

        // 元素大小固定时初始化fixedSize
        if (this.list.IsFixedSize && this._fixedSize === null) {
            this.addItemNode(false);
            this._fixedSize = this._itemPool[0].getContentSize();
        }

        // 注册事件
        this.node.on(cc.Node.EventType.POSITION_CHANGED, this.onPositionChanged, this);
    }

    protected onDestroy(): void {
        // 注销事件
        this.node.off(cc.Node.EventType.POSITION_CHANGED, this.onPositionChanged, this);
    }

    protected lateUpdate(): void {
        this.updateSize();
        this.updateView();
    }

    /**
     * 更新content size
     */
    private updateSize(): void {
        if (!this._sizeDirty) {
            return;
        }
        this._sizeDirty = false;

        if (this.list.IsFixedSize) {
            this.updateSizeFixed();
        } else {
            this.updateSizeUnfixed();
        }
    }

    private updateSizeFixed(): void {
        if (this.Type === LayoutType.VERTICAL) {
            if (this.dataArr.length <= 0) {
                this.node.height = 0;
                return;
            }

            this.node.height = this.Top + this.Bottom + (this.dataArr.length - 1) * this.SpacingY + this._fixedSize.height * this.dataArr.length;
        } else if (this.Type === LayoutType.HORIZONTAL) {
            if (this.dataArr.length <= 0) {
                this.node.width = 0;
                return;
            }

            this.node.width = this.Left + this.Right + (this.dataArr.length - 1) * this.SpacingX + this._fixedSize.width * this.dataArr.length;
        } else {
            if (this.StartAxis === AxisDirection.HORIZONTAL) {
                if (this.dataArr.length <= 0) {
                    this.node.height = 0;
                    return;
                }

                // 计算一行可以排列几个，至少1个
                let num = Math.floor((this.node.width - this.Left - this.Right + this.SpacingX) / (this._fixedSize.width + this.SpacingX));
                num = Math.max(num, 1);
                // 计算可以排列几行
                let row = Math.ceil(this.dataArr.length / num);
                // 高度
                this.node.height = this.Top + this.Bottom + (row - 1) * this.SpacingY + this._fixedSize.height * row;
            } else {
                if (this.dataArr.length <= 0) {
                    this.node.width = 0;
                    return;
                }

                // 计算一列可以排列几个，至少1个
                let num = Math.floor((this.node.height - this.Top - this.Bottom + this.SpacingY) / (this._fixedSize.height + this.SpacingY));
                num = Math.max(num, 1);
                // 计算可以排列几列
                let column = Math.ceil(this.dataArr.length / num);
                // 宽度
                this.node.width = this.Left + this.Right + (column - 1) * this.SpacingX + this._fixedSize.width * column;
            }
        }
    }

    private updateSizeUnfixed(): void {

    }

    /**
     * 更新view区域数据显示
     */
    private updateView(): void {
        if (!this._viewDirty || this.dataArr.length <= 0) {
            return;
        }
        this._viewDirty = false;

        if (this.list.IsFixedSize) {
            this.updateViewFixed();
        } else {
            this.updateViewUnfixed();
        }
    }

    private updateViewFixed(): void {
        let viewResult = this.checkViewItem();
        let inView = viewResult.inView;
        let outView = viewResult.outView;
        let contentEdge = this.getNodeEdgeRect(this.node);
        let xMax: number, xMin: number, yMax: number, yMin: number;
        if (this.Type === LayoutType.VERTICAL) {
            for (let i = 0; i < this.dataArr.length; i++) {
                if (this.VerticalDirection === VerticalDirection.TOP_TO_BOTTOM) {
                    yMax = contentEdge.yMax - (this.Top + i * this.SpacingY + this._fixedSize.height * i);
                    yMin = yMax - this._fixedSize.height;
                    if (yMax + this.node.y < this._viewEdge.yMin) {
                        return;
                    }
                    if (yMin + this.node.y > this._viewEdge.yMax) {
                        continue;
                    }
                } else {
                    yMin = contentEdge.yMin + this.Bottom + i * this.SpacingY + this._fixedSize.height * i;
                    yMax = yMin + this._fixedSize.height;
                    if (yMin + this.node.y > this._viewEdge.yMax) {
                        return;
                    }
                    if (yMax + this.node.y < this._viewEdge.yMin) {
                        continue;
                    }
                }

                // 判断显示区域内部是否有节点显示此条数据
                let found = inView.findIndex((e) => { return this._items[e].getComponent(VirtualItem).dataIdx === i; });
                if (found !== -1) {
                    continue;
                }

                // 没有节点显示此条数据，需使用显示区域外的节点显示此条数据
                let itemIdx: number = outView.length === 0 ? this.addItemNode() : outView.shift();
                let item: cc.Node = this._items[itemIdx];
                this.setItem(cc.v3(0, yMin + item.anchorY * item.height), i, itemIdx);
            }
        } else if (this.Type === LayoutType.HORIZONTAL) {
            for (let i = 0; i < this.dataArr.length; i++) {
                if (this.HorizontalDirection === HorizontalDirection.RIGHT_TO_LEFT) {
                    xMax = contentEdge.xMax - (this.Right + i * this.SpacingX + this._fixedSize.width * i);
                    xMin = xMax - this._fixedSize.width;
                    if (xMax + this.node.x < this._viewEdge.xMin) {
                        return;
                    }
                    if (xMin + this.node.x > this._viewEdge.xMax) {
                        continue;
                    }
                } else {
                    xMin = contentEdge.xMin + this.Left + i * this.SpacingX + this._fixedSize.width * i;
                    xMax = xMin + this._fixedSize.width;
                    if (xMin + this.node.x > this._viewEdge.xMax) {
                        return;
                    }
                    if (xMax + this.node.x < this._viewEdge.xMin) {
                        continue;
                    }
                }

                // 判断显示区域内部是否有节点显示此条数据
                let found = inView.findIndex((e) => { return this._items[e].getComponent(VirtualItem).dataIdx === i; });
                if (found !== -1) {
                    continue;
                }

                // 没有节点显示此条数据，需使用显示区域外的节点显示此条数据
                let itemIdx: number = outView.length === 0 ? this.addItemNode() : outView.shift();
                let item: cc.Node = this._items[itemIdx];
                this.setItem(cc.v3(xMin + item.anchorX * item.width, 0), i, itemIdx);
            }
        } else {
            for (let i = 0; i < this.dataArr.length; i++) {
                // 计算当前元素排在第几行第几列，从0开始
                let rowIndex: number = 0;
                let columnIndex: number = 0;
                if (this.StartAxis === AxisDirection.HORIZONTAL) {
                    let num = Math.floor((this.node.width - this.Left - this.Right + this.SpacingX) / (this._fixedSize.width + this.SpacingX));
                    num = Math.max(num, 1);
                    rowIndex = Math.floor(i / num);
                    columnIndex = i % num;
                    if (this.VerticalDirection === VerticalDirection.TOP_TO_BOTTOM) {
                        yMax = contentEdge.yMax - (this.Top + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex);
                        yMin = yMax - this._fixedSize.height;
                        if (yMax + this.node.y < this._viewEdge.yMin) {
                            return;
                        }
                        if (yMin + this.node.y > this._viewEdge.yMax) {
                            continue;
                        }
                    } else {
                        yMin = contentEdge.yMin + this.Bottom + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex;
                        yMax = yMin + this._fixedSize.height;
                        if (yMin + this.node.y > this._viewEdge.yMax) {
                            return;
                        }
                        if (yMax + this.node.y < this._viewEdge.yMin) {
                            continue;
                        }
                    }
                    if (this.HorizontalDirection === HorizontalDirection.RIGHT_TO_LEFT) {
                        xMax = contentEdge.xMax - (this.Right + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex);
                        xMin = xMax - this._fixedSize.width;
                        if (xMax + this.node.x < this._viewEdge.xMin) {
                            continue;
                        }
                        if (xMin + this.node.x > this._viewEdge.xMax) {
                            continue;
                        }
                    } else {
                        xMin = contentEdge.xMin + this.Left + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex;
                        xMax = xMin + this._fixedSize.width;
                        if (xMin + this.node.x > this._viewEdge.xMax) {
                            continue;
                        }
                        if (xMax + this.node.x < this._viewEdge.xMin) {
                            continue;
                        }
                    }
                } else {
                    let num = Math.floor((this.node.height - this.Top - this.Bottom + this.SpacingY) / (this._fixedSize.height + this.SpacingY));
                    num = Math.max(num, 1);
                    rowIndex = i % num;
                    columnIndex = Math.floor(i / num);
                    if (this.HorizontalDirection === HorizontalDirection.RIGHT_TO_LEFT) {
                        xMax = contentEdge.xMax - (this.Right + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex);
                        xMin = xMax - this._fixedSize.width;
                        if (xMax + this.node.x < this._viewEdge.xMin) {
                            return;
                        }
                        if (xMin + this.node.x > this._viewEdge.xMax) {
                            continue;
                        }
                    } else {
                        xMin = contentEdge.xMin + this.Left + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex;
                        xMax = xMin + this._fixedSize.width;
                        if (xMin + this.node.x > this._viewEdge.xMax) {
                            return;
                        }
                        if (xMax + this.node.x < this._viewEdge.xMin) {
                            continue;
                        }
                    }
                    if (this.VerticalDirection === VerticalDirection.TOP_TO_BOTTOM) {
                        yMax = contentEdge.yMax - (this.Top + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex);
                        yMin = yMax - this._fixedSize.height;
                        if (yMax + this.node.y < this._viewEdge.yMin) {
                            continue;
                        }
                        if (yMin + this.node.y > this._viewEdge.yMax) {
                            continue;
                        }
                    } else {
                        yMin = contentEdge.yMin + this.Bottom + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex;
                        yMax = yMin + this._fixedSize.height;
                        if (yMin + this.node.y > this._viewEdge.yMax) {
                            continue;
                        }
                        if (yMax + this.node.y < this._viewEdge.yMin) {
                            continue;
                        }
                    }
                }

                // 判断显示区域内部是否有节点显示此条数据
                let found = inView.findIndex((e) => { return this._items[e].getComponent(VirtualItem).dataIdx === i; });
                if (found !== -1) {
                    continue;
                }

                // 没有节点显示此条数据，需使用显示区域外的节点显示此条数据
                let itemIdx: number = outView.length === 0 ? this.addItemNode() : outView.shift();
                let item: cc.Node = this._items[itemIdx];
                this.setItem(cc.v3(xMin + item.anchorX * item.width, yMin + item.anchorY * item.height), i, itemIdx);
            }
        }
    }

    private updateViewUnfixed(): void {

    }

    /**
     * 区分在view内部与外部的items数组下标
     */
    private checkViewItem(): { inView: number[], outView: number[] } {
        return this.list.IsFixedSize ? this.checkViewItemFixed() : this.checkViewItemUnfixed();
    }

    private checkViewItemFixed(): { inView: number[], outView: number[] } {
        // 显示区域内部的下标
        let inView: number[] = [];
        // 显示区域外部的下标
        let outView: number[] = [];

        if (this.Type === LayoutType.VERTICAL) {
            for (let i = 0; i < this._items.length; i++) {
                let item = this._items[i];
                let box = item.getBoundingBox();
                if (box.yMin + this.node.y <= this._viewEdge.yMax && box.yMax + this.node.y >= this._viewEdge.yMin) {
                    inView.push(i);
                } else {
                    outView.push(i);
                }
            }
        } else if (this.Type === LayoutType.HORIZONTAL) {
            for (let i = 0; i < this._items.length; i++) {
                let item = this._items[i];
                let box = item.getBoundingBox();
                if (box.xMin + this.node.x <= this._viewEdge.xMax && box.xMax + this.node.x >= this._viewEdge.xMin) {
                    inView.push(i);
                } else {
                    outView.push(i);
                }
            }
        } else {
            for (let i = 0; i < this._items.length; i++) {
                let item = this._items[i];
                let box = item.getBoundingBox();
                if (box.xMin + this.node.x <= this._viewEdge.xMax && box.xMax + this.node.x >= this._viewEdge.xMin
                    && box.yMin + this.node.y <= this._viewEdge.yMax && box.yMax + this.node.y >= this._viewEdge.yMin) {
                    inView.push(i);
                } else {
                    outView.push(i);
                }
            }
        }

        return { inView: inView, outView: outView };
    }

    private checkViewItemUnfixed(): { inView: number[], outView: number[] } {
        // 显示区域内部的下标
        let inView: number[] = [];
        // 显示区域外部的下标
        let outView: number[] = [];

        return { inView: inView, outView: outView };
    }

    /**
     * 设置item数据与坐标
     * @param p 节点坐标
     * @param dataIdx this._dataArr的下标 
     * @param itemIdx this._items的下标
     */
    private setItem(p: cc.Vec3, dataIdx: number, itemIdx: number): void {
        let item = this._items[itemIdx];
        item.position = p;
        let vi = item.getComponent(VirtualItem);
        vi.dataIdx = dataIdx;
        vi.onRefresh(this.dataArr[dataIdx]);

        if (this.list.Others.length > 0) {
            let nodes: cc.Node[] = [];
            this._otherItemsArr.forEach((e) => {
                e[itemIdx].position = p;
                nodes.push(e[itemIdx]);
            });
            vi.onRefreshOthers(...nodes);
        }
    }

    /**
     * 激活新的节点，并添加到content下
     * @param active 默认为true，false时不激活节点并添加进节点池中(仅在onInit中使用)
     * @returns 激活的节点在this._items中的下标
     */
    private addItemNode(active: boolean = true): number {
        let node: cc.Node = null;
        if (this._itemPool.length > 0) {
            node = this._itemPool.pop();
            node.active = true;
            this._items.push(node);

            this._otherItemPoolArr.forEach((e, i) => {
                let otherNode = e.pop();
                otherNode.active = true;
                this._otherItemsArr[i].push(otherNode);
            });
        } else {
            let tmp: cc.Node | cc.Prefab = this.list.Main.TemplateType === MainTemplateType.PREFAB ? this.list.Main.TemplatePrefab : this.list.Main.TemplateNode;
            node = Res.instantiate(tmp, this.node);
            if (!node.getComponent(VirtualItem)) {
                node.addComponent(VirtualItem);
            }
            this.node.addChild(node);
            if (active) {
                node.active = true;
                this._items.push(node);
            } else {
                node.active = false;
                this.putItemNode(node);
            }

            // 拷贝一份子节点数组，防止子节点移除时改变下标
            let childrenCopy = node.children.slice(0);
            this.list.Others.forEach((e, i) => {
                let otherNode: cc.Node = null;
                switch (e.TemplateType) {
                    case OtherTemplateType.NODE:
                        otherNode = Res.instantiate(e.TemplateNode, this.node);
                        break;
                    case OtherTemplateType.PREFAB:
                        otherNode = Res.instantiate(e.TemplatePrefab, this.node);
                        break;
                    case OtherTemplateType.MAIN_ITEM_CHILD:
                        if (!Tool.inRange(0, childrenCopy.length - 1, e.TemplateChild)) {
                            cc.error(`[VirtualLayout.addItemNode] error e.TemplateChild: ${e.TemplateChild}`);
                            return;
                        }
                        otherNode = childrenCopy[e.TemplateChild];
                        otherNode.removeFromParent();
                        break;
                    default:
                        cc.error(`[VirtualLayout.addItemNode] error e.TemplateType: ${e.TemplateType}`);
                        return;
                }
                e.Content.addChild(otherNode);
                if (active) {
                    otherNode.active = true;
                    this._otherItemsArr[i].push(otherNode);
                } else {
                    otherNode.active = false;
                    this.putItemNode(otherNode, true, i);
                }
            });
        }

        return this._items.length - 1;
    }

    /**
     * 回收item节点
     * @param node 
     * @param isOther 是否为Others下的节点
     * @param otherIdx Others的下标
     */
    private putItemNode(node: cc.Node, isOther: boolean = false, otherIdx: number = 0): void {
        node.active = false;
        if (isOther) {
            this._otherItemPoolArr[otherIdx].push(node);
        } else {
            let vi = node.getComponent(VirtualItem);
            vi.onReset();
            this._itemPool.push(node);
        }
    }

    /**
     * 子节点坐标系下坐标转换为父节点坐标系下坐标
     */
    private convertToParentPos(pos: cc.Vec3, child: cc.Node): cc.Vec3 {
        return pos.add(child.position);
    }

    /**
     * 父节点坐标系下坐标转换为子节点坐标系下坐标
     */
    private convertToChildPos(pos: cc.Vec3, child: cc.Node): cc.Vec3 {
        return pos.sub(child.position);
    }

    /**
     * 获取节点自身坐标系下的节点边界矩形
     */
    private getNodeEdgeRect(node: cc.Node): cc.Rect {
        return cc.rect(-node.width * node.anchorX, -node.height * node.anchorY, node.width, node.height);
    }

    /**
     * content位移监听回调
     */
    private onPositionChanged(): void {
        this._viewDirty = true;

        this.list.Others.forEach((e) => {
            e.Content.position = this.node.position;
        });
    }

    /**
     * 清空节点重新排列
     */
    private clearAllItem(): void {
        this._items.forEach((e, i) => {
            this.putItemNode(e);
            this._otherItemsArr.forEach((arr, otherIdx) => { this.putItemNode(arr[i], true, otherIdx); });
        });
        this._items.length = 0;
        this._otherItemsArr.forEach((arr) => { arr.length = 0; });
    }

    /**
     * 获取content相对view左上角原点位置的偏移值
     * @param idx 元素下标
     * @param itemAnchor 元素的锚点位置（左下角为0点）
     * @param viewAnchor view的锚点位置（左下角为0点）
     */
    public getScrollOffset(idx: number, itemAnchor: cc.Vec2, viewAnchor: cc.Vec2): cc.Vec2 {
        idx = Math.min(idx, this.dataArr.length - 1);
        return this.list.IsFixedSize ? this.getScrollOffsetFixed(idx, itemAnchor, viewAnchor) : this.getScrollOffsetUnfixed(idx, itemAnchor, viewAnchor);
    }

    private getScrollOffsetFixed(idx: number, itemAnchor: cc.Vec2, viewAnchor: cc.Vec2): cc.Vec2 {
        let contentEdge = this.getNodeEdgeRect(this.node);
        let xMax: number, xMin: number, yMax: number, yMin: number;
        if (this.Type === LayoutType.VERTICAL) {
            if (this.VerticalDirection === VerticalDirection.TOP_TO_BOTTOM) {
                yMax = contentEdge.yMax - (this.Top + idx * this.SpacingY + this._fixedSize.height * idx);
                yMin = yMax - this._fixedSize.height;
            } else {
                yMin = contentEdge.yMin + this.Bottom + idx * this.SpacingY + this._fixedSize.height * idx;
                yMax = yMin + this._fixedSize.height;
            }
            let x = this._viewEdge.xMin - (contentEdge.xMin + this.node.x);
            let y = contentEdge.yMax - (this._fixedSize.height * itemAnchor.y + yMin) - (1 - viewAnchor.y) * this._viewEdge.height;
            return cc.v2(x, y);
        } else if (this.Type === LayoutType.HORIZONTAL) {
            if (this.HorizontalDirection === HorizontalDirection.RIGHT_TO_LEFT) {
                xMax = contentEdge.xMax - (this.Right + idx * this.SpacingX + this._fixedSize.width * idx);
                xMin = xMax - this._fixedSize.width;
            } else {
                xMin = contentEdge.xMin + this.Left + idx * this.SpacingX + this._fixedSize.width * idx;
                xMax = xMin + this._fixedSize.width;
            }
            let x = this._fixedSize.width * itemAnchor.x + xMin - contentEdge.xMin - viewAnchor.x * this._viewEdge.width;
            let y = contentEdge.yMax - (this._viewEdge.yMax - this.node.y);
            return cc.v2(x, y);
        } else {
            // 计算当前元素排在第几行第几列，从0开始
            let rowIndex: number = 0;
            let columnIndex: number = 0;
            if (this.StartAxis === AxisDirection.HORIZONTAL) {
                let num = Math.floor((this.node.width - this.Left - this.Right + this.SpacingX) / (this._fixedSize.width + this.SpacingX));
                num = Math.max(num, 1);
                rowIndex = Math.floor(idx / num);
                columnIndex = idx % num;
            } else {
                let num = Math.floor((this.node.height - this.Top - this.Bottom + this.SpacingY) / (this._fixedSize.height + this.SpacingY));
                num = Math.max(num, 1);
                rowIndex = idx % num;
                columnIndex = Math.floor(idx / num);
            }

            if (this.VerticalDirection === VerticalDirection.TOP_TO_BOTTOM) {
                yMax = contentEdge.yMax - (this.Top + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex);
                yMin = yMax - this._fixedSize.height;
            } else {
                yMin = contentEdge.yMin + this.Bottom + rowIndex * this.SpacingY + this._fixedSize.height * rowIndex;
                yMax = yMin + this._fixedSize.height;
            }

            if (this.HorizontalDirection === HorizontalDirection.RIGHT_TO_LEFT) {
                xMax = contentEdge.xMax - (this.Right + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex);
                xMin = xMax - this._fixedSize.width;
            } else {
                xMin = contentEdge.xMin + this.Left + columnIndex * this.SpacingX + this._fixedSize.width * columnIndex;
                xMax = xMin + this._fixedSize.width;
            }
            let x = this._fixedSize.width * itemAnchor.x + xMin - contentEdge.xMin - viewAnchor.x * this._viewEdge.width;
            let y = contentEdge.yMax - (this._fixedSize.height * itemAnchor.y + yMin) - (1 - viewAnchor.y) * this._viewEdge.height;
            return cc.v2(x, y);
        }
    }

    private getScrollOffsetUnfixed(idx: number, itemAnchor: cc.Vec2, viewAnchor: cc.Vec2): cc.Vec2 {
        return null;
    }

    public reset(index: number, args: T): void {
        if (Tool.inRange(0, this.dataArr.length - 1, index)) {
            this.dataArr[index] = args;
            this.clearAllItem();
            this._sizeDirty = true;
            this._viewDirty = true;
        }
    }

    public push(args: T): number {
        let result = this.dataArr.push(args);
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }

    public pop(): T {
        let result = this.dataArr.pop();
        this.clearAllItem();
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }

    public unshift(args: T): number {
        let result = this.dataArr.unshift(args);
        this.clearAllItem();
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }

    public shift(): T {
        let result = this.dataArr.shift();
        this.clearAllItem();
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }

    public splice(start: number, deleteCount?: number, ...argsArr: T[]): T[] {
        let result: T[];
        if (deleteCount === undefined) {
            result = this.dataArr.splice(start);
        } else {
            if (argsArr === undefined || argsArr.length === 0) {
                result = this.dataArr.splice(start, deleteCount);
            } else {
                result = this.dataArr.splice(start, deleteCount, ...argsArr);
            }
        }

        this.clearAllItem();
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }

    public sort(call: (a: T, b: T) => number): T[] {
        let result = this.dataArr.sort(call);
        this.clearAllItem();
        this._sizeDirty = true;
        this._viewDirty = true;
        return result;
    }
}
