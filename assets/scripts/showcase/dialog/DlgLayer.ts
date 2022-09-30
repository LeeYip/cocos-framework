import DialogBase from "../../common/cmpt/base/DialogBase";
import Layer from "../../common/cmpt/base/Layer";
import { DirUrl } from "../../common/const/Url";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgLayer extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "layer/DlgLayer";

    /**
     * @override
     */
    public open() {

    }

    private async onClockAwait() {
        await Layer.inst.openUniDialogAsync(DirUrl.PREFAB_DIALOG + "layer/DlgLayer2");
        await Layer.inst.waitCloseDialog(DirUrl.PREFAB_DIALOG + "layer/DlgLayer2");
        await Layer.inst.openUniDialogAsync(DirUrl.PREFAB_DIALOG + "layer/DlgLayer3");
    }

    private onClickTipUnique() {
        Layer.inst.showTip({ text: "这是一条唯一提示", unique: true, end: cc.v2(0, 100) });
    }

    private onClickTip() {
        Layer.inst.showTip({ text: "这是一条普通提示", end: cc.v2(0, 100), duration: 0 });
    }
}
