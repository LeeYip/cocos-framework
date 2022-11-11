import Layer from "../../common/cmpt/base/Layer";
import { ResUrl } from "../../common/const/Url";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Home extends cc.Component {

    private onClickGame() {
        Layer.inst.enterMain(ResUrl.PREFAB.GAME);
    }
}
