import Layer from "../../common/cmpt/base/Layer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Label) public DcLab: cc.Label = null;

    protected start() {
        Layer.inst.enterHome();
    }

    protected lateUpdate() {
        this.DcLab.string = `DrawCall: ${cc.renderer.drawCalls}`;
    }
}
