import DialogBase from "../../common/cmpt/base/DialogBase";
import AnimValueLabel from "../../common/cmpt/ui/AnimValueLabel";
import AnimValueProgress from "../../common/cmpt/ui/AnimValueProgress";
import AnimValueProgressHP from "../../common/cmpt/ui/AnimValueProgressHP";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgAnimValue extends DialogBase {
    public static pUrl: string = 'DlgAnimValue';

    @property(AnimValueLabel) public AnimLab: AnimValueLabel = null;
    @property(AnimValueProgress) public AnimProgress: AnimValueProgress = null;
    @property(AnimValueProgressHP) public AnimHP: AnimValueProgressHP = null;

    private onClickLabAdd() {
        this.AnimLab.setValue(this.AnimLab.endValue + 10);
    }

    private onClickLabSub() {
        this.AnimLab.setValue(this.AnimLab.endValue - 10);
    }

    private onClickProgressAdd() {
        this.AnimProgress.setValue(Math.min(1, this.AnimProgress.endValue + 0.2));
    }

    private onClickProgressSub() {
        this.AnimProgress.setValue(Math.max(0, this.AnimProgress.endValue - 0.2));
    }

    private onClickHPAdd() {
        this.AnimHP.setValue(Math.min(1, this.AnimHP.endValue + 0.2));
    }

    private onClickHPSub() {
        this.AnimHP.setValue(Math.max(0, this.AnimHP.endValue - 0.2));
    }
}
