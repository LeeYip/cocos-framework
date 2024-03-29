import Layer from "../../common/cmpt/base/Layer";
import { ResUrl } from "../../common/const/Url";
import Res from "../../common/util/Res";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Label) public dcLab: cc.Label = null;

    protected start() {
        Layer.inst.enterMain(ResUrl.PREFAB.HOME);
        // 60s清理一次缓存
        this.schedule(() => {
            Res.releaseAll();
        }, 60);
    }

    protected lateUpdate() {
        this.dcLab.string = `DrawCall: ${cc.renderer.drawCalls}`;
    }
}
