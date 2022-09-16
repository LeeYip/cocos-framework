import AnimValueProgress from "./AnimValueProgress";

const { ccclass, property, menu, requireComponent, executeInEditMode } = cc._decorator;

/**
 * 血条组件
 */
@ccclass
@executeInEditMode
@requireComponent(cc.ProgressBar)
@menu("Framework/UI组件/AnimValueProgressHP")
export default class AnimValueProgressHP extends AnimValueProgress {
    @property({
        type: cc.Sprite,
        tooltip: CC_DEV && "血条阴影，如果barSprite渲染模式为filled模式，此sprite也要对应修改，保持一致"
    })
    public barShadow: cc.Sprite = null;

    private setBarShadow(progress: number): void {
        switch (this.progressBar.mode) {
            case cc.ProgressBar.Mode.HORIZONTAL:
                this.barShadow.node.width = this.progressBar.totalLength * progress;
                break;
            case cc.ProgressBar.Mode.VERTICAL:
                this.barShadow.node.height = this.progressBar.totalLength * progress;
                break;
            case cc.ProgressBar.Mode.FILLED:
                this.barShadow.fillRange = progress;
            default:
                break;
        }
    }

    /**
     * @override
     */
    protected onAnimStart(): void {
        if (this.isAdd) {

        } else {
            this.progressBar.progress = this.endValue;
        }
    }

    /**
     * @override
     */
    protected onAnimUpdate(): void {
        if (this.isAdd) {
            this.setBarShadow(this.curValue);
            this.progressBar.progress = this.curValue;
        } else {
            this.setBarShadow(this.curValue);
        }
    }
}
