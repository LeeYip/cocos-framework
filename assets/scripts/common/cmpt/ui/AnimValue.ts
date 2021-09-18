import { Easing, SCALE_TWEEN, Tween } from "../../util/Tween";

const { ccclass, property, menu, requireComponent, executeInEditMode } = cc._decorator;

/**
 * 进度变化类型
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
 * 数值渐变组件
 */
@ccclass
@executeInEditMode
@requireComponent(cc.Label)
@menu('Framework/UI组件/AnimValue')
export default class AnimValue extends cc.Component {
    @property private _endValue: number = 0;
    @property private _curValue: number = 0;

    @property({
        tooltip: CC_DEV && '初始值'
    })
    private get InitValue(): number { return this._endValue; }
    private set InitValue(v: number) {
        this._curValue = v;
        this._endValue = v;
        this.setValueImmediately(this._endValue);
    }

    @property({
        type: cc.Enum(AnimType),
        tooltip: CC_DEV && '进度变化类型'
    })
    public AnimType: AnimType = AnimType.SPEED;

    @property({
        tooltip: CC_DEV && '每秒数值变化速度',
        visible() { return this.AnimType === AnimType.SPEED }
    })
    public Speed: number = 1;

    @property({
        tooltip: CC_DEV && '数值变化的时长',
        visible() { return this.AnimType === AnimType.DURATION }
    })
    public Duration: number = 1;

    @property({
        type: cc.Enum(EasingType),
        tooltip: CC_DEV && '变化的缓动类型'
    })
    public EasingType: EasingType = EasingType.NONE;

    @property({
        tooltip: CC_DEV && '变化速度是否受到timeScale的影响'
    })
    public TimeScale: boolean = false;

    /** 缓存动画的resolve */
    private _animResolve: (value: void | PromiseLike<void>) => void
    private _tween: Tween<this> = null;
    private _isAdd: boolean = false;
    /** 当前是否为增量变化 */
    public get isAdd() { return this._isAdd; }

    /** 变化的目标值 */
    public get endValue() { return this._endValue; }
    /** 变化过程的当前值 */
    public get curValue() { return this._curValue; }

    /**
     * @virtual
     */
    protected onAnimStart() {
    }

    /**
     * @virtual
     */
    protected onAnimUpdate() {
    }

    /**
     * @virtual
     */
    protected onAnimComplete() {
        this._tween = null;
    }

    /**
     * @virtual
     * 立即设置value，不执行动画
     */
    protected setValueImmediately(end: number) {
        if (this._animResolve) {
            this._animResolve();
            this._animResolve = null;
        }
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
        this._endValue = end;
        this._curValue = end;
    }

    /**
     * @virtual
     * 设置进度值。异步方法，进度动画结束后resolve
     * @param end 目标进度值
     * @param anim 是否执行动画，默认true
     */
    public async setValue(end: number, anim: boolean = true): Promise<void> {
        if (!anim) {
            this.setValueImmediately(end);
            return;
        }

        return new Promise((resolve, reject) => {
            this._animResolve = resolve;
            this._endValue = end;
            this._isAdd = this._endValue - this._curValue > 0;
            this._tween?.stop();
            this._tween = this.TimeScale ? new Tween(this, SCALE_TWEEN) : new Tween(this);
            let duration = this.AnimType === AnimType.DURATION ? this.Duration : Math.abs(this._endValue - this._curValue) / this.Speed;
            switch (this.EasingType) {
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
                    if (this._animResolve) {
                        this._animResolve();
                        this._animResolve = null;
                    }
                })
                .start();
        });
    }

    /**
     * @virtual
     * 停止动画，并中止之前未结束的Promise
     */
    public stop() {
        if (this._animResolve) {
            this._animResolve = null;
        }
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }
}
