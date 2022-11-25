import Tool from "../../util/Tool";
import { SCALE_TWEEN, Tween } from "../../util/Tween";

const { ccclass, property, menu } = cc._decorator;

type CountdownFormat = string | { "S": string; "M": string; "H": string; "D": string };

/**
 * 倒计时显示组件
 */
@ccclass
@menu("Framework/UI组件/CountdownLabel")
export default class CountdownLabel extends cc.Component {
    @property({
        tooltip: CC_DEV && "倒计时是否受到timeScale的影响"
    })
    public timeScale: boolean = false;

    private _tween: Tween<this> = null;
    private _updateCall: () => void = null;
    private _completeCall: () => void = null;

    /** 格式化参数，详见`Tool.formatTimeString` */
    private _format: CountdownFormat = "%{hh}:%{mm}:%{ss}";
    /** 剩余秒数 */
    private _leftSec: number = 0;
    public get leftSec(): number { return this._leftSec; }
    private _leftFloorSec: number = 0;

    private _label: cc.Label | cc.RichText = null;
    public get label(): cc.Label | cc.RichText {
        if (!this._label) {
            this._label = this.getComponent(cc.Label) ?? this.getComponent(cc.RichText);
        }
        return this._label;
    }

    public startCountdown(sec: number, format: CountdownFormat = "%{hh}:%{mm}:%{ss}", updateCall: () => void = null, completeCall: () => void = null): void {
        this._leftSec = sec;
        this._leftFloorSec = Math.floor(sec);
        this._format = format;
        this._updateCall = updateCall;
        this._completeCall = completeCall;
        this._tween?.stop();
        this._tween = this.timeScale ? new Tween(this, SCALE_TWEEN) : new Tween(this);
        this._tween.to({ _leftSec: 0 }, sec * 1000)
            .onUpdate(() => {
                this.onUpdate();
            })
            .onComplete(() => {
                this.onComplete();
            })
            .start();
    }

    private onUpdate(): void {
        // 每隔1s更新一次
        let floorSec = Math.floor(this._leftSec);
        if (floorSec === this._leftFloorSec) {
            return;
        }

        // 更新文本显示
        this._leftFloorSec = floorSec;
        if (this.label) {
            this.label.string = Tool.formatTimeString(this._leftFloorSec, this._format);
        }

        // 更新回调
        this._updateCall?.();
    }

    private onComplete(): void {
        this._completeCall?.();
    }
}
