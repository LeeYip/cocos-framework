import DialogBase from "../../common/cmpt/base/DialogBase";
import ShakeNode from "../../common/cmpt/ui/ShakeNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgShake extends DialogBase {
    public static pUrl: string = 'DlgShake';

    @property(ShakeNode) shake: ShakeNode = null;

    private onClickShake() {
        this.shake.shake(1);
    }
}
