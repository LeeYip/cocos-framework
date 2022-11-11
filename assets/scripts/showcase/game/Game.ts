import Layer from "../../common/cmpt/base/Layer";
import { DirUrl, ResUrl } from "../../common/const/Url";
import { eventsOnLoad } from "../../common/util/Events";
import Res from "../../common/util/Res";
import DlgAnimValue from "../dialog/DlgAnimValue";
import DlgAudio from "../dialog/DlgAudio";
import DlgCircleList from "../dialog/DlgCircleList";
import DlgEvents from "../dialog/DlgEvents";
import DlgI18N from "../dialog/DlgI18N";
import DlgLayer from "../dialog/DlgLayer";
import DlgMultiTexture from "../dialog/DlgMultiTexture";
import DlgShader from "../dialog/DlgShader";
import DlgShake from "../dialog/DlgShake";
import DlgTimer from "../dialog/DlgTimer";
import DlgVirtualList from "../dialog/DlgVirtualList";

const { ccclass, property } = cc._decorator;

@ccclass
@eventsOnLoad()
export default class Game extends cc.Component {

    private onClickHome() {
        Layer.inst.enterMain(ResUrl.PREFAB.HOME);
    }

    private onClickTimer() {
        Layer.inst.openUniDialogAsync(DlgTimer.pUrl);
    }

    private onClickLayer() {
        Layer.inst.openUniDialogAsync(DlgLayer.pUrl);
    }

    private onClickShader() {
        Layer.inst.openUniDialogAsync(DlgShader.pUrl);
    }

    private onClickAnimValue() {
        Layer.inst.openUniDialogAsync(DlgAnimValue.pUrl);
    }

    private onClickButton() {
        Layer.inst.openUniDialogAsync(DirUrl.PREFAB_DIALOG + "DlgButton");
    }

    private onClickShake() {
        Layer.inst.openUniDialogAsync(DlgShake.pUrl);
    }

    private onClickVirtualList() {
        Layer.inst.openUniDialogAsync(DlgVirtualList.pUrl);
    }

    private onClickCircleList() {
        Layer.inst.openUniDialogAsync(DlgCircleList.pUrl);
    }

    private async onClickAudio() {
        Layer.inst.openUniDialogAsync(DlgAudio.pUrl);
        Layer.inst.showLoading();
        await Res.loadDir(DirUrl.AUDIO, cc.AudioClip);
        Layer.inst.hideLoading();
    }

    private onClickI18N() {
        Layer.inst.openUniDialogAsync(DlgI18N.pUrl);
    }

    private onClickEvent() {
        Layer.inst.openUniDialogAsync(DlgEvents.pUrl);
    }

    private onClickMultiTexture() {
        Layer.inst.openUniDialogAsync(DlgMultiTexture.pUrl);
    }
}
