import DialogBase from "../../common/cmpt/base/DialogBase";
import LoopList from "../../common/cmpt/ui/scrollList/LoopList";
import { DirUrl } from "../../common/const/Url";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgLoopList extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgLoopList";

    @property(LoopList) list: LoopList = null;

    /**
     * @override
     */
    public onOpen() {
        this.list.onInit(10, 5, this.refreshItem, this);
    }

    private refreshItem(item: cc.Node, idx: number, isCur: boolean) {
        let color = {
            0: cc.color(255, 200, 200),
            1: cc.color(200, 255, 200),
            2: cc.color(200, 200, 255),
            3: cc.color(100, 200, 255),
            4: cc.color(200, 100, 255),
            5: cc.color(200, 100, 155),
            6: cc.color(100, 150, 105),
            7: cc.color(100, 250, 255),
            8: cc.color(200, 150, 255),
            9: cc.color(105, 100, 100)
        }
        item.color = color[idx];
        item.getChildByName("lab").getComponent(cc.Label).string = `${idx}${isCur ? "-cur" : ""}`;
    }
}
