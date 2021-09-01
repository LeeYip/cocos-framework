import Layer from "../../common/cmpt/base/Layer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Home extends cc.Component {

    private onClickGame() {
        Layer.inst.enterGame();
    }
}
