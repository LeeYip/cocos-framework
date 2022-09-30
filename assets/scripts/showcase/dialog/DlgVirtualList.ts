import DialogBase from "../../common/cmpt/base/DialogBase";
import VirtualList from "../../common/cmpt/ui/scrollList/VirtualList";
import { DirUrl } from "../../common/const/Url";
import Tool from "../../common/util/Tool";
import { ItemArgs } from "./ListItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgVirtualList extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgVirtualList";

    @property(VirtualList) list: VirtualList<ItemArgs> = null;
    @property(cc.Label) rndLab: cc.Label = null;

    private _rnd: number = 0;

    /**
     * @override
     */
    public open() {
        for (let i = 0; i < 50; i++) {
            this.list.push({ num: Tool.randInt(0, 1000) });
        }

        this._rnd = Tool.randInt(0, this.list.argsArr.length);
        this.rndLab.string = `-> 下一次滚动到的下标为：${this._rnd}`;
    }

    private onClickAdd() {
        this.list.push({ num: Tool.randInt(0, 1000) });
    }

    private onClickDelete() {
        this.list.splice(0, 1);
    }

    private onClickScroll() {
        // 滚动到对应下标的item的左上角对齐view的左上角
        this.list.scrollItemToView(this._rnd, cc.v2(0, 1), cc.v2(0, 1), 0.5, true);
        this._rnd = Tool.randInt(0, this.list.argsArr.length);
        this.rndLab.string = `-> 下一次滚动到的下标为：${this._rnd}`;
    }
}
