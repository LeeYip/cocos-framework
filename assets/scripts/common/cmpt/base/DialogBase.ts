import EditorTool from "../../util/EditorTool";
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
    private dlgAnim: cc.Animation = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '打开弹窗的动画',
        visible() { return !!this.dlgAnim; }
    })
    private openClip: cc.AnimationClip = null;

    @property({
        type: cc.AnimationClip,
        tooltip: CC_DEV && '关闭弹窗的动画',
        visible() { return !!this.dlgAnim; }
    })
    private closeClip: cc.AnimationClip = null;

    /** 外部的resolve函数，在弹窗close时调用 */
    private _resolveList: Array<(value?: any) => void> = [];

    private _prefabUrl: string = '';
    /** 弹窗prefab在resources/prefab/dialog/下的路径 */
    public get prefabUrl(): string { return this._prefabUrl; }

    protected onLoad(): void {
        if (this.dlgAnim) {
            this.openClip && this.dlgAnim.addClip(this.openClip);
            this.closeClip && this.dlgAnim.addClip(this.closeClip);
            this.dlgAnim.on(cc.Animation.EventType.FINISHED, this.onAnimFinished, this);
        }
    }

    protected resetInEditor(): void {
        if (CC_EDITOR) {
            for (let i = 0; i < this.node.childrenCount; i++) {
                let anim: cc.Animation = this.node.children[i].getComponent(cc.Animation);
                if (anim) {
                    this.dlgAnim = anim;
                    EditorTool.load<cc.AnimationClip>('res/animation/dialog/open.anim').then((v) => { this.openClip = v; });
                    EditorTool.load<cc.AnimationClip>('res/animation/dialog/close.anim').then((v) => { this.closeClip = v; });
                    break;
                }
            }
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
    public open(...args: any[]): any {
    }

    /**
     * 关闭弹窗，销毁节点时的处理。
     * - 必须使用此接口销毁，子类重写时请调用super.close()
     * @virtual
     */
    public close(): any {
        this._resolveList.forEach((resolve) => { resolve(); });
        this.node.removeFromParent();
        this.node.destroy();
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
