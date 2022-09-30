import DialogBase from "../../common/cmpt/base/DialogBase";
import ShakeNode from "../../common/cmpt/ui/ShakeNode";
import { DirUrl } from "../../common/const/Url";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgShake extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgShake";

    @property(ShakeNode) shake: ShakeNode = null;

    private onClickShake() {
        this.shake.shake(1);
    }
}
