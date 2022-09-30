import DialogBase from "../../common/cmpt/base/DialogBase";
import Timer from "../../common/cmpt/base/Timer";
import { EventName } from "../../common/const/EventName";
import { DirUrl } from "../../common/const/Url";
import Events, { preloadEvent } from "../../common/util/Events";
import { SCALE_TWEEN, Tween } from "../../common/util/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgTimer extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgTimer";

    @property(cc.Slider) public slider: cc.Slider = null;
    @property(cc.Node) move1: cc.Node = null;
    @property(cc.Node) move2: cc.Node = null;
    @property(cc.Node) move3: cc.Node = null;

    private _dir = 1;
    private _tween: Tween<any> = null;

    protected onLoad() {
        super.onLoad();
        Events.targetOn(this);
    }

    protected onDestroy() {
        this._tween?.stop();
        Events.targetOff(this);
    }

    protected update() {
        this.move2.x += Timer.scaleDt * 300 * this._dir;
        if (this._dir > 0 && this.move2.x > 500) {
            this._dir = -1;
        } else if (this._dir < 0 && this.move2.x < -500) {
            this._dir = 1;
        }
    }

    /**
     * @override
     */
    public open() {
        this.slider.progress = Timer.timeScale;
        this.slider.node.getChildByName("lab").getComponent(cc.Label).string = `timescale: ${Math.floor(this.slider.progress * 100) / 100}`;
        this.eventTimeScale();

        this._tween = new Tween(this.move3, SCALE_TWEEN)
            .to({ x: [300, -300], y: [300, -300] }, 2000)
            .repeat(1000)
            .start();
    }

    private onSlide() {
        this.slider.node.getChildByName("lab").getComponent(cc.Label).string = `timescale: ${Math.floor(this.slider.progress * 100) / 100}`;
        Timer.timeScale = this.slider.progress;
    }

    @preloadEvent(EventName.TIME_SCALE)
    private eventTimeScale() {
        this.move1.getComponent(cc.Animation).getAnimationState("move").speed = Timer.timeScale;
    }
}
