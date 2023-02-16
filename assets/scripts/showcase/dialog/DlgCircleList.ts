import DialogBase from "../../common/cmpt/base/DialogBase";
import CircleList from "../../common/cmpt/ui/scrollList/CircleList";
import { DirUrl } from "../../common/const/Url";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgCircleList extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgCircleList";

    @property(CircleList) list: CircleList = null;

    /**
     * @override
     */
    public open() {
        this.list.init();
    }
}
