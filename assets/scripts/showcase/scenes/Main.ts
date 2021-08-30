import Layer from "../../common/cmpt/base/Layer";
import { DirUrl } from "../../common/const/Url";
import Res from "../../common/util/Res";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    protected async start() {
        Layer.inst.showLoading();
        await Res.loadDir(DirUrl.PREFAB, cc.Prefab);
        await Res.loadDir(DirUrl.AUDIO, cc.AudioClip);
        Layer.inst.hideLoading();
        Layer.inst.enterHome();
    }
}
