import Tool from "../../util/Tool";

const { ccclass, property, disallowMultiple, menu } = cc._decorator;

/**
 * 弹窗基类
 */
@ccclass
@disallowMultiple
@menu('Framework/基础组件/DialogBase')
export default class DialogBase extends cc.Component {
    /** 弹窗prefab在resources/prefab/dialog/下的路径 */
    public static pUrl: string = '';

    @property(cc.Animation)
    public DlgAnim: cc.Animation = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '打开弹窗的动画',
        visible() { return !!this.DlgAnim; }
    })
    public OpenClip: cc.AnimationClip = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '关闭弹窗的动画',
        visible() { return !!this.DlgAnim; }
    })
    public CloseClip: cc.AnimationClip = null;

    /** 外部的resolve函数，在弹窗close时调用 */
    private _resolveList: Array<(value?: any) => void> = [];

    private _prefabUrl: string = '';
    /** 弹窗prefab在resources/prefab/dialog/下的路径 */
    public get prefabUrl() { return this._prefabUrl; }

    protected onLoad() {
        if (this.DlgAnim) {
            this.OpenClip && this.DlgAnim.addClip(this.OpenClip);
            this.CloseClip && this.DlgAnim.addClip(this.CloseClip);
            this.DlgAnim.on(cc.Animation.EventType.FINISHED, this.onAnimFinished, this);
        }
    }

    protected onAnimFinished() {
        if (this.DlgAnim.currentClip === this.CloseClip) {
            this.close();
        }
    }

    /**
     * 打开动画
     */
    public playOpen() {
        if (this.DlgAnim && this.OpenClip) {
            this.DlgAnim.play(this.OpenClip.name);
        }
    }

    /**
     * 关闭动画，动画结束回调中会调用close销毁
     */
    public playClose() {
        if (this.DlgAnim && this.CloseClip) {
            if (this.DlgAnim.getAnimationState(this.CloseClip.name).isPlaying) {
                return;
            }
            this.DlgAnim.play(this.CloseClip.name);
        } else {
            this.close();
        }
    }

    /**
     * @virtual
     * 打开弹窗时的处理
     */
    public open(...args: any[]): any {
    }

    /**
     * @virtual
     * 关闭弹窗，销毁节点时的处理。
     * - 必须使用此接口销毁，子类重写时请调用super.close()
     */
    public close(): any {
        this._resolveList.forEach((resolve) => { resolve(); });
        this.node.removeFromParent();
        this.node.destroy();
    }

    /**
     * @virtual
     * 关闭按钮回调
     */
    protected onClickClose() {
        this.playClose();
    }

    /**
     * 添加外部resolve函数，在弹窗close时调用
     */
    public addResolve(resolve: (value?: any) => void) {
        Tool.arrayAdd(this._resolveList, resolve);
    }
}
