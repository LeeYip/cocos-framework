import DialogBase from "../../common/cmpt/base/DialogBase";
import AnimValueLabel from "../../common/cmpt/ui/animValue/AnimValueLabel";
import AnimValueProgress from "../../common/cmpt/ui/animValue/AnimValueProgress";
import AnimValueProgressHP from "../../common/cmpt/ui/animValue/AnimValueProgressHP";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgAnimValue extends DialogBase {
    public static pUrl: string = "DlgAnimValue";

    @property(AnimValueLabel) public animLab: AnimValueLabel = null;
    @property(AnimValueProgress) public animProgress: AnimValueProgress = null;
    @property(AnimValueProgressHP) public animHP: AnimValueProgressHP = null;

    private onClickLabAdd() {
        this.animLab.setValue(this.animLab.endValue + 10);
    }

    private onClickLabSub() {
        this.animLab.setValue(this.animLab.endValue - 10);
    }

    private onClickProgressAdd() {
        this.animProgress.setValue(Math.min(1, this.animProgress.endValue + 0.2));
    }

    private onClickProgressSub() {
        this.animProgress.setValue(Math.max(0, this.animProgress.endValue - 0.2));
    }

    private onClickHPAdd() {
        this.animHP.setValue(Math.min(1, this.animHP.endValue + 0.2));
    }

    private onClickHPSub() {
        this.animHP.setValue(Math.max(0, this.animHP.endValue - 0.2));
    }
}
