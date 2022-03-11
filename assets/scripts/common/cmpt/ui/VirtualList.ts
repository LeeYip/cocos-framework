import VirtualLayout from "./VirtualLayout";

const { ccclass, property, requireComponent, executeInEditMode, disallowMultiple, menu } = cc._decorator;

/** 主元素模板类型 */
export enum MainTemplateType {
    NODE,
    PREFAB
}

/** 副元素模板类型 */
export enum OtherTemplateType {
    NODE,
    PREFAB,
    MAIN_ITEM_CHILD,
}

/** 虚拟列表元素参数类型 */
export interface VirtualArgs { }

/**
 * 虚拟列表主容器
 */
@ccclass('MainLayoutData')
export class MainLayoutData {
    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表容器节点',
        visible() { return false; }
    })
    public Content: cc.Node = null;

    @property({ type: cc.Enum(MainTemplateType) })
    private _templateType: MainTemplateType = MainTemplateType.PREFAB;
    @property({
        type: cc.Enum(MainTemplateType),
        tooltip: CC_DEV && '列表元素模板类型'
    })
    public get TemplateType(): MainTemplateType { return this._templateType; }
    public set TemplateType(v: MainTemplateType) {
        if (this._templateType === v) {
            return;
        }
        this._templateType = v;
        this.resetMainItemChild(true);
    }

    @property(cc.Prefab)
    private _templatePrefab: cc.Prefab = null;
    @property({
        type: cc.Prefab,
        tooltip: CC_DEV && '列表元素模板预制体',
        visible() { return this.TemplateType === MainTemplateType.PREFAB; }
    })
    public get TemplatePrefab(): cc.Prefab { return this._templatePrefab; }
    public set TemplatePrefab(v: cc.Prefab) {
        if (this._templatePrefab === v) {
            return;
        }
        this._templatePrefab = v;
        this.resetMainItemChild(true);
    }

    @property(cc.Node)
    private _templateNode: cc.Node = null;
    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表元素模板节点',
        visible() { return this.TemplateType === MainTemplateType.NODE; }
    })
    public get TemplateNode(): cc.Node { return this._templateNode; }
    public set TemplateNode(v: cc.Node) {
        if (this._templateNode === v) {
            return;
        }
        this._templateNode = v;
        this.resetMainItemChild(true);
    }

    public editorCall: (mainItemChild: unknown, refresh: boolean) => void = null;

    /**
     * 更新枚举内容
     * @param refresh 是否强制刷新inspector 
     * @returns 
     */
    public resetMainItemChild(refresh: boolean = false): void {
        if (!CC_EDITOR) {
            return;
        }
        let mainItemChild = {};
        if (this.TemplateType === MainTemplateType.NODE && this.TemplateNode) {
            this.TemplateNode.children.forEach((c, i) => { mainItemChild[c.name] = i; });
        } else if (this.TemplateType === MainTemplateType.PREFAB && this.TemplatePrefab) {
            this.TemplatePrefab.data.children.forEach((c, i) => { mainItemChild[c.name] = i; });
        }
        this.editorCall?.(mainItemChild, refresh);
    }
}

/**
 * 虚拟列表副容器
 */
@ccclass('OtherLayoutData')
export class OtherLayoutData {
    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表容器节点',
    })
    public Content: cc.Node = null;

    @property({
        type: cc.Enum(OtherTemplateType),
        tooltip: CC_DEV && '列表元素模板类型'
    })
    public TemplateType: OtherTemplateType = OtherTemplateType.PREFAB;

    @property({
        type: cc.Prefab,
        tooltip: CC_DEV && '列表元素模板预制体',
        visible() { return this.TemplateType === OtherTemplateType.PREFAB; }
    })
    public TemplatePrefab: cc.Prefab = null;

    @property({
        type: cc.Node,
        tooltip: CC_DEV && '列表元素模板节点',
        visible() { return this.TemplateType === OtherTemplateType.NODE; }
    })
    public TemplateNode: cc.Node = null;

    @property({
        type: cc.Enum({}),
        tooltip: CC_DEV && '以列表主元素的子节点作为模板节点',
        visible() { return this.TemplateType === OtherTemplateType.MAIN_ITEM_CHILD; }
    })
    public TemplateChild: number = -1;
}

/**
 * 虚拟列表
 */
@ccclass
@disallowMultiple
@executeInEditMode
@requireComponent(cc.ScrollView)
@menu('Framework/UI组件/VirtualList')
export default class VirtualList<T extends VirtualArgs> extends cc.Component {
    @property({ type: MainLayoutData, tooltip: CC_DEV && '列表主容器' })
    public Main: MainLayoutData = new MainLayoutData();

    @property({ type: OtherLayoutData, tooltip: CC_DEV && '列表副容器\n需要分层显示时使用，一般用于降低draw call' })
    public Others: OtherLayoutData[] = [];

    @property({
        visible: false,
        tooltip: CC_DEV && '元素节点大小是否一致且固定不变，大小不定时更耗性能（目前不支持此选项，必须为true）'
    })
    public IsFixedSize: boolean = true;

    private _scrollView: cc.ScrollView = null;
    private _layout: VirtualLayout<T> = null;

    protected onLoad(): void {
        if (CC_EDITOR) {
            this.runEditor();
            return;
        }

        this._scrollView = this.getComponent(cc.ScrollView);
        this._layout = this._scrollView.content.getComponent(VirtualLayout);
        if (this._layout) {
            this._layout.list = this;
            this._layout.onInit();
        }
    }

    protected resetInEditor(): void {
        this.runEditor();
    }

    protected onFocusInEditor(): void {
        this.Main.resetMainItemChild();
    }

    /**
     * 编辑器模式下的一些设置
     */
    private runEditor(): void {
        if (!CC_EDITOR) {
            return;
        }
        let scrollView = this.getComponent(cc.ScrollView);
        let layout = scrollView.content.getComponent(VirtualLayout);
        if (!this.Main.Content) {
            this.Main.Content = scrollView.content;
        }
        if (!layout) {
            scrollView.content.addComponent(VirtualLayout);
        }
        this.Main.editorCall = (mainItemChild: unknown, refresh: boolean): void => {
            let hasChildType = false;
            for (let i = 0; i < this.Others.length; i++) {
                if (this.Others[i].TemplateType === OtherTemplateType.MAIN_ITEM_CHILD) {
                    hasChildType = true;
                    break;
                }
            }
            if (hasChildType) {
                cc.Class['Attr'].setClassAttr(OtherLayoutData, 'TemplateChild', 'enumList', cc.Enum['getList'](mainItemChild));
                if (refresh) {
                    Editor.Utils.refreshSelectedInspector('node', this.node.uuid);
                }
            }
        };
        this.Main.resetMainItemChild();
    }

    /**
     * 滚动元素节点到view的指定位置
     * @param idx 元素下标
     * @param itemAnchor 元素的锚点位置（左下角为0点）
     * @param viewAnchor view的锚点位置（左下角为0点）
     * @param t 时间 s
     * @param a 加速度是否衰减，为true且滚动距离大时滚动会不准确
     */
    public scrollItemToView(idx: number, itemAnchor: cc.Vec2 = cc.v2(), viewAnchor: cc.Vec2 = cc.v2(), t: number = 0, a: boolean = true): void {
        this._scrollView.scrollToOffset(this._layout.getScrollOffset(idx, itemAnchor, viewAnchor), t, a);
    }

    /**
     * 获取列表数据
     */
    public getDataArr(): T[] {
        return this._layout.dataArr;
    }

    /**
     * 重置某个元素数据
     * @param index 
     * @param args 元素所需参数
     */
    public reset(index: number, args: T): void {
        this._layout.reset(index, args);
    }

    /**
     * 添加元素数据到尾部
     * @param args 元素所需参数
     */
    public push(args: T): number {
        return this._layout.push(args);
    }

    /**
     * 删除尾部元素数据
     */
    public pop(): T {
        return this._layout.pop();
    }

    /**
     * 添加元素数据到头部
     * @param args 
     */
    public unshift(args: T): number {
        return this._layout.unshift(args);
    }

    /**
     * 删除头部元素数据
     */
    public shift(): T {
        return this._layout.shift();
    }

    /**
     * 插入或删除元素 用法同数组splice
     */
    public splice(start: number, deleteCount?: number, ...argsArr: T[]): T[] {
        return this._layout.splice(start, deleteCount, ...argsArr);
    }

    /**
     * 数据排序
     * @param call 
     */
    public sort(call: (a: T, b: T) => number): T[] {
        return this._layout.sort(call);
    }
}
