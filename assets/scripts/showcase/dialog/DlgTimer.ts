import DialogBase from "../../common/cmpt/base/DialogBase";
import Timer from "../../common/cmpt/base/Timer";
import { EventName } from "../../common/const/EventName";
import Events, { preloadEvent } from "../../common/util/Events";
import { SCALE_TWEEN, Tween } from "../../common/util/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgTimer extends DialogBase {
    public static pUrl: string = 'DlgTimer';

    @property(cc.Slider) public Slider: cc.Slider = null;
    @property(cc.Node) Move1: cc.Node = null;
    @property(cc.Node) Move2: cc.Node = null;
    @property(cc.Node) Move3: cc.Node = null;

    private _dir = 1;
    private _tween: Tween<any> = null;

    protected onLoad() {
        super.onLoad();
        Events.targetOn(this);
    }

    protected update() {
        this.Move2.x += Timer.scaleDt * 300 * this._dir;
        if (this._dir > 0 && this.Move2.x > 500) {
            this._dir = -1;
        } else if (this._dir < 0 && this.Move2.x < -500) {
            this._dir = 1;
        }
    }

    protected onDestroy() {
        this._tween && this._tween.stop();
        Events.targetOff(this);
    }

    /**
     * @override
     */
    public open() {
        this.Slider.progress = Timer.timeScale;
        this.Slider.node.getChildByName('lab').getComponent(cc.Label).string = `timescale: ${Math.floor(this.Slider.progress * 100) / 100}`;
        this.eventTimeScale();

        this._tween = new Tween(this.Move3, SCALE_TWEEN)
            .to({ x: [300, -300], y: [300, -300] }, 2000)
            .repeat(1000)
            .start();
    }

    private onSlide() {
        this.Slider.node.getChildByName('lab').getComponent(cc.Label).string = `timescale: ${Math.floor(this.Slider.progress * 100) / 100}`;
        Timer.timeScale = this.Slider.progress;
    }

    @preloadEvent(EventName.TIME_SCALE)
    private eventTimeScale() {
        this.Move1.getComponent(cc.Animation).getAnimationState('move').speed = Timer.timeScale;
    }
}
