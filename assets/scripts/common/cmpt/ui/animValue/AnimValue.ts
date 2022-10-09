import { Easing, SCALE_TWEEN, Tween } from "../../../util/Tween";

const { ccclass, property, menu, executeInEditMode } = cc._decorator;

/**
 * 数值变化类型
 */
enum AnimType {
    /** 以速度计算变化时长 */
    SPEED,
    /** 固定时长 */
    DURATION,
}

/**
 * 固定时长时的缓动类型
 */
enum EasingType {
    NONE,
    IN,
    OUT,
    IN_OUT,
}

/**
 * 数值渐变组件基类，可根据此组件拓展各种数值渐变的组件
 */
@ccclass
@executeInEditMode
@menu("Framework/UI组件/AnimValue")
export default class AnimValue extends cc.Component {
    @property private _endValue: number = 0;
    @property private _curValue: number = 0;

    @property({
        tooltip: CC_DEV && "初始值"
    })
    private get initValue(): number { return this._endValue; }
    private set initValue(v: number) {
        this._curValue = v;
        this._endValue = v;
        this.setValueImmediately(this._endValue);
    }

    @property({
        type: cc.Enum(AnimType),
        tooltip: CC_DEV && "数值变化类型\nSPEED：以速度计算变化时长\nDURATION：固定时长"
    })
    public animType: AnimType = AnimType.SPEED;

    @property({
        tooltip: CC_DEV && "每秒数值变化速度",
        visible() { return this.animType === AnimType.SPEED; }
    })
    public speed: number = 1;

    @property({
        tooltip: CC_DEV && "数值变化的总时长",
        visible() { return this.animType === AnimType.DURATION; }
    })
    public duration: number = 1;

    @property({
        type: cc.Enum(EasingType),
        tooltip: CC_DEV && "变化的缓动类型"
    })
    public easingType: EasingType = EasingType.NONE;

    @property({
        tooltip: CC_DEV && "变化速度是否受到timeScale的影响"
    })
    public timeScale: boolean = false;

    /** 缓存动画的resolve */
    private _animResolve: (value: void | PromiseLike<void>) => void;
    private _tween: Tween<this> = null;
    private _isAdd: boolean = false;
    /** 当前是否为增量变化 */
    public get isAdd(): boolean { return this._isAdd; }

    /** 变化的目标值 */
    public get endValue(): number { return this._endValue; }
    /** 变化过程的当前值 */
    public get curValue(): number { return this._curValue; }

    /**
     * @virtual
     */
    protected onAnimStart(): void {
    }

    /**
     * @virtual
     */
    protected onAnimUpdate(): void {
    }

    /**
     * @virtual
     */
    protected onAnimComplete(): void {
        if (this._animResolve) {
            this._animResolve();
            this._animResolve = null;
        }
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    /**
     * 立即设置value，不执行动画
     * @virtual
     */
    protected setValueImmediately(end: number): void {
        this._isAdd = this._endValue - this._curValue > 0;
        this._endValue = end;
        this._curValue = end;
        this.onAnimStart();
        this.onAnimUpdate();
        this.onAnimComplete();
    }

    /**
     * 设置进度值。进度动画结束后resolve
     * @virtual
     * @param end 目标进度值
     * @param anim 是否执行动画，默认true
     */
    public setValue(end: number, anim: boolean = true): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!anim) {
                this.setValueImmediately(end);
                resolve();
                return;
            }

            this._animResolve = resolve;
            this._endValue = end;
            this._isAdd = this._endValue - this._curValue > 0;
            this._tween?.stop();
            this._tween = this.timeScale ? new Tween(this, SCALE_TWEEN) : new Tween(this);
            let duration = this.animType === AnimType.DURATION ? this.duration : Math.abs(this._endValue - this._curValue) / this.speed;
            switch (this.easingType) {
                case EasingType.IN:
                    this._tween.easing(Easing.Quadratic.In);
                    break;
                case EasingType.OUT:
                    this._tween.easing(Easing.Quadratic.Out);
                    break;
                case EasingType.IN_OUT:
                    this._tween.easing(Easing.Quadratic.InOut);
                    break;
                default:
                    break;
            }
            this._tween.to({ _curValue: this._endValue }, duration * 1000)
                .onStart(() => {
                    this.onAnimStart();
                })
                .onUpdate(() => {
                    this.onAnimUpdate();
                })
                .onComplete(() => {
                    this.onAnimComplete();
                })
                .start();
        });
    }

    /**
     * 停止动画，并中止之前未结束的Promise
     * @virtual
     */
    public stop(): void {
        if (this._animResolve) {
            this._animResolve = null;
        }
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }
}
