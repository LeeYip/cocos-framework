import Layer from "../../common/cmpt/base/Layer";
import Events from "../../common/util/Events";
import DlgAnimValue from "../dialog/DlgAnimValue";
import DlgButton from "../dialog/DlgButton";
import DlgLayer from "../dialog/DlgLayer";
import DlgShader from "../dialog/DlgShader";
import DlgShake from "../dialog/DlgShake";
import DlgTimer from "../dialog/DlgTimer";
import DlgVirtualList from "../dialog/DlgVirtualList";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    protected onLoad() {
        Events.targetOn(this);
    }

    protected onDestroy() {
        Events.targetOff(this);
    }

    private onClickHome() {
        Layer.inst.enterHome();
    }

    private onClickTimer() {
        Layer.inst.openUniDialog(DlgTimer.pUrl);
    }

    private onClickLayer() {
        Layer.inst.openUniDialog(DlgLayer.pUrl);
    }

    private onClickShader() {
        Layer.inst.openUniDialog(DlgShader.pUrl);
    }

    private onClickAnimValue() {
        Layer.inst.openUniDialog(DlgAnimValue.pUrl);
    }

    private onClickButton() {
        Layer.inst.openUniDialog(DlgButton.pUrl);
    }

    private onClickShake() {
        Layer.inst.openUniDialog(DlgShake.pUrl);
    }

    private onClickList() {
        Layer.inst.openUniDialog(DlgVirtualList.pUrl);
    }
}
