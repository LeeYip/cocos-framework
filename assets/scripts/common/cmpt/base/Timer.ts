import { EventName } from "../../const/EventName";
import Events from "../../util/Events";
import { SCALE_TWEEN, TWEEN } from "../../util/Tween";

const { ccclass, executionOrder, menu, disallowMultiple } = cc._decorator;

if (!CC_EDITOR) {
    cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, (scene: cc.Scene) => {
        if (Timer.timer) {
            return;
        }

        cc.log("addPersistRootNode: TIMER");
        let node = new cc.Node("TIMER");
        cc.game.addPersistRootNode(node);
        node.addComponent(Timer);
    });
}

/**
 * - 全局时间管理器，场景加载后会自动绑定常驻节点，保证全局有且只有一个
 * - 负责TWEEN和SCALE_TWEEN的管理与更新
 */
@ccclass
@disallowMultiple
@executionOrder(-1000)
@menu("Framework/基础组件/Timer")
export default class Timer extends cc.Component {
    //#region 静态成员

    /** 全局第一个加载的Timer组件 */
    private static _timer: Timer = null;
    public static get timer(): Timer {
        return this._timer;
    }

    /** 游戏调用暂停的计数 */
    private static _puaseCount: number = 0;

    private static _lastTimeScale: number = 1;
    private static _timeScale: number = 1;
    /** 
     * dt缩放倍数，1为正常速度，0为暂停
     * - 需要特别注意此值的修改和暂停、恢复如果同时多处调用产生的效果是否正确
     */
    public static get timeScale(): number { return this._timeScale; }
    public static set timeScale(v: number) {
        if (v === this._timeScale || v < 0) {
            return;
        }
        this._timeScale = v;
        Events.emit(EventName.TIME_SCALE);
    }

    private static _realDt: number = 0;
    /** 距上一帧间隔的真实时间 */
    public static get realDt(): number { return this._realDt; }
    /** 距上一帧间隔经过timeScale缩放的时间 */
    public static get scaleDt(): number { return this._realDt * this._timeScale; }

    private static _gameSec: number = 0;
    private static _scaleGameSec: number = 0;
    /** 游戏启动经过的时长 s */
    public static get gameSec(): number { return this._gameSec; }
    /** 游戏启动经过的时长 ms */
    public static get gameMs(): number { return this._gameSec * 1000; }
    /** 游戏经过缩放的时长 s */
    public static get scaleGameSec(): number { return this._scaleGameSec; }
    /** 游戏经过缩放的时长 ms */
    public static get scaleGameMs(): number { return this._scaleGameSec * 1000; }

    /**
     * 重置 timeScale
     */
    public static reset(): void {
        this._puaseCount = 0;
        this._timeScale = 1;
        this._lastTimeScale = 1;
    }

    /**
     * 暂停游戏 timeScale设置为0 （需要与gameResume成对调用）
     */
    public static gamePause(): void {
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
    public static gameResume(): void {
        if (this._puaseCount <= 0) {
            return;
        }
        this._puaseCount--;
        if (this._puaseCount <= 0) {
            this._timeScale = this._lastTimeScale;
            Events.emit(EventName.GAME_RESUME);
        }
    }

    //#endregion

    protected onLoad(): void {
        if (Timer._timer) {
            return;
        }
        Timer._timer = this;
    }

    protected onDestroy(): void {
        if (Timer._timer === this) {
            Timer._timer = null;
        }

        TWEEN.removeAll();
        SCALE_TWEEN.removeAll();
    }

    protected update(dt: number): void {
        // 只启用第一个加载的组件
        if (Timer._timer !== this) {
            return;
        }

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
