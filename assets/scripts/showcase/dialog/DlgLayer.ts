import DialogBase from "../../common/cmpt/base/DialogBase";
import Layer from "../../common/cmpt/base/Layer";
import DlgLayer2 from "./DlgLayer2";
import DlgLayer3 from "./DlgLayer3";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgLayer extends DialogBase {
    public static pUrl: string = 'layer/DlgLayer';

    /**
     * @override
     */
    public open() {

    }

    private async onClockAwait() {
        Layer.inst.openUniDialog(DlgLayer2.pUrl);
        await Layer.inst.waitCloseDialog(DlgLayer2.pUrl);
        Layer.inst.openUniDialog(DlgLayer3.pUrl);
    }
}
