import DialogBase from "../../common/cmpt/base/DialogBase";
import VirtualList from "../../common/cmpt/ui/VirtualList";
import Tool from "../../common/util/Tool";
import { ItemArgs } from "./ListItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgVirtualList extends DialogBase {
    public static pUrl: string = 'DlgVirtualList';

    @property(VirtualList) List: VirtualList<ItemArgs> = null;
    @property(cc.Label) RndLab: cc.Label = null;

    private _rnd: number = 0;

    /**
     * @override
     */
    public open() {
        for (let i = 0; i < 50; i++) {
            this.List.push({num: Tool.randInt(0, 1000)});
        }

        this._rnd = Tool.randInt(0, this.List.getDataArr().length);
        this.RndLab.string = `-> 下一次滚动到的下标为：${this._rnd}`;
    }

    private onClickAdd() {
        this.List.push({num: Tool.randInt(0, 1000)});
    }

    private onClickDelete() {
        this.List.splice(0, 1);
    }

    private onClickScroll() {
        // 滚动到对应下标的item的左上角对齐view的左上角
        this.List.scrollItemToView(this._rnd, cc.v2(0, 1), cc.v2(0, 1), 0.5, true);
        this._rnd = Tool.randInt(0, this.List.getDataArr().length);
        this.RndLab.string = `-> 下一次滚动到的下标为：${this._rnd}`;
    }
}
