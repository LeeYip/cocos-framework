import EditorTool from "../../util/EditorTool";
import RecyclePool from "../../util/RecyclePool";
import Tool from "../../util/Tool";

const { ccclass, property, disallowMultiple, menu } = cc._decorator;

/**
 * 弹窗基类
 */
@ccclass
@disallowMultiple
@menu("Framework/基础组件/DialogBase")
export default class DialogBase extends cc.Component {
    /** 弹窗prefab路径，规则同Res加载路径 */
    public static pUrl: string = "";

    @property({ tooltip: CC_DEV && "关闭弹窗时是否缓存弹窗节点", })
    protected cache: boolean = false;

    @property(cc.Animation)
    protected dlgAnim: cc.Animation = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && "打开弹窗的动画",
        visible() { return !!this.dlgAnim; }
    })
    protected openClip: cc.AnimationClip = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && "关闭弹窗的动画",
        visible() { return !!this.dlgAnim; }
    })
    protected closeClip: cc.AnimationClip = null;

    /** 外部的resolve函数，在弹窗close时调用 */
    private _resolveList: Array<(value?: any) => void> = [];

    private _prefabUrl: string = "";
    /** 弹窗prefab路径，规则同Res加载路径 */
    public get prefabUrl(): string { return this._prefabUrl; }

    protected onLoad(): void {
        if (this.dlgAnim) {
            this.openClip && this.dlgAnim.addClip(this.openClip);
            this.closeClip && this.dlgAnim.addClip(this.closeClip);
            this.dlgAnim.on(cc.Animation.EventType.FINISHED, this.onAnimFinished, this);
        }
    }

    protected resetInEditor(): void {
        if (!CC_EDITOR) {
            return;
        }
        // 动画
        for (let i = 0; i < this.node.childrenCount; i++) {
            let anim: cc.Animation = this.node.children[i].getComponent(cc.Animation);
            if (anim) {
                this.dlgAnim = anim;
                EditorTool.load<cc.AnimationClip>("res/animation/dialog/open.anim").then((v) => { this.openClip = v; });
                EditorTool.load<cc.AnimationClip>("res/animation/dialog/close.anim").then((v) => { this.closeClip = v; });
                break;
            }
        }
        // 触摸拦截
        if (this.node.childrenCount <= 0 || !this.node.children[0].getComponent(cc.BlockInputEvents)) {
            let block = new cc.Node("Block");
            this.node.addChild(block);
            block.setSiblingIndex(0);
            block.setContentSize(this.node.getContentSize());
            block.addComponent(cc.BlockInputEvents);
            let widget = block.addComponent(cc.Widget);
            widget.isAlignTop = true;
            widget.isAlignBottom = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
        }
    }

    protected onAnimFinished(): void {
        if (this.dlgAnim.currentClip === this.closeClip) {
            this.close();
        }
    }

    /**
     * 打开动画
     */
    public playOpen(): void {
        if (this.dlgAnim && this.openClip) {
            this.dlgAnim.play(this.openClip.name);
        }
    }

    /**
     * 关闭动画，动画结束回调中会调用close销毁
     */
    public playClose(): void {
        if (this.dlgAnim && this.closeClip) {
            if (this.dlgAnim.getAnimationState(this.closeClip.name).isPlaying) {
                return;
            }
            this.dlgAnim.play(this.closeClip.name);
        } else {
            this.close();
        }
    }

    /**
     * 打开弹窗时的处理
     * @virtual
     */
    public onOpen(...args: any[]): void {
    }

    /**
     * 关闭弹窗时的处理
     * @virtual
     */
    public onClose(): void {
    }

    /**
     * 关闭弹窗
     * - 必须使用此接口关闭，子类重写时请调用super.close()
     * @virtual
     */
    public close(): void {
        this.onClose();
        this._resolveList.forEach((resolve) => { resolve(); });
        if (this.cache) {
            RecyclePool.put(this.prefabUrl, this.node);
        } else {
            this.node.removeFromParent();
            this.node.destroy();
        }
    }

    /**
     * 关闭按钮回调
     * @virtual
     */
    protected onClickClose(): void {
        this.playClose();
    }

    /**
     * 添加外部resolve函数，在弹窗close时调用
     */
    public addResolve(resolve: (value?: any) => void): void {
        Tool.arrayAdd(this._resolveList, resolve);
    }
}
