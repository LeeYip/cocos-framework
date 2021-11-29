import { EventName } from "../../const/EventName";
import Events from "../../util/Events";
import { SCALE_TWEEN, TWEEN } from "../../util/Tween";

const { ccclass, property, executionOrder, menu, disallowMultiple } = cc._decorator;

/**
 * - 全局时间管理器，需绑定常驻节点，保证全局有且只有一个
 * - 负责TWEEN和SCALE_TWEEN的管理与更新
 */
@ccclass
@disallowMultiple
@executionOrder(-1000)
@menu('Framework/基础组件/Timer')
export default class Timer extends cc.Component {
    //#region 静态成员

    /** 游戏调用暂停的计数 */
    private static _puaseCount: number = 0;

    private static _lastTimeScale: number = 1;
    private static _timeScale: number = 1;
    /** 
     * dt缩放倍数，1为正常速度，0为暂停
     * - 需要特别注意此值的修改和暂停、恢复如果同时多处调用产生的效果是否正确
     */
    public static get timeScale() { return this._timeScale; }
    public static set timeScale(v: number) {
        if (v === this._timeScale || v < 0) {
            return;
        }
        this._timeScale = v;
        Events.emit(EventName.TIME_SCALE);
    }

    private static _realDt: number = 0;
    /** 距上一帧间隔的真实时间 */
    public static get realDt() { return this._realDt; }
    /** 距上一帧间隔经过timeScale缩放的时间 */
    public static get scaleDt() { return this._realDt * this._timeScale; }

    private static _gameSec: number = 0;
    private static _scaleGameSec: number = 0;
    /** 游戏启动经过的时长 s */
    public static get gameSec() { return this._gameSec; }
    /** 游戏启动经过的时长 ms */
    public static get gameMs() { return this._gameSec * 1000; }
    /** 游戏经过缩放的时长 s */
    public static get scaleGameSec() { return this._scaleGameSec; }
    /** 游戏经过缩放的时长 ms */
    public static get scaleGameMs() { return this._scaleGameSec * 1000; }

    /**
     * 重置 timeScale
     */
    public static reset() {
        this._puaseCount = 0;
        this._timeScale = 1;
        this._lastTimeScale = 1;
    }

    /**
     * 暂停游戏 timeScale设置为0 （需要与gameResume成对调用）
     */
    public static gamePause() {
        this._puaseCount++;
        if (this._puaseCount > 1) {
            return;
        }
        this._lastTimeScale = this._timeScale;
        this._timeScale = 0;
        Events.emit(EventName.GAME_PAUSE);
    }

    /**
     * 恢复游戏 （需要与gamePause成对调用）
     */
    public static gameResume() {
        if (this._puaseCount <= 0) {
            return;
        }
        this._puaseCount--;
        if (this._puaseCount <= 0) {
            this._timeScale = this._lastTimeScale;
            Events.emit(EventName.GAME_RESUME);
        }
    }

    /**
     * 对单位为秒的时间生成格式化时间字符串
     * @param t 时间s
     */
    public static getFormatTime(t: number): string {
        let seconds: number = Math.floor(t);
        let minutes: number = Math.floor(seconds / 60);
        let hours: number = Math.floor(seconds / 3600);

        let h: string = hours < 10 ? `0${hours}` : `${hours}`;
        let m: string = minutes % 60 < 10 ? `0${minutes % 60}` : `${minutes % 60}`;
        let s: string = seconds % 60 < 10 ? `0${seconds % 60}` : `${seconds % 60}`;

        return hours > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    }

    //#endregion

    protected onDestroy() {
        TWEEN.removeAll();
        SCALE_TWEEN.removeAll();
    }

    protected update(dt: number) {
        Timer._realDt = dt;
        Timer._gameSec += dt;
        Timer._scaleGameSec += Timer.scaleDt;

        TWEEN.update(Timer.gameMs);
        // scaleDt大于0时更新SCALE_TWEEN
        if (Timer.scaleDt > 0) {
            SCALE_TWEEN.update(Timer.scaleGameMs);
        }
    }
}
