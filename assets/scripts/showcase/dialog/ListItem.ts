import VirtualItem from "../../common/cmpt/ui/VirtualItem";
import { VirtualArgs } from "../../common/cmpt/ui/VirtualList";

const { ccclass, property } = cc._decorator;

export interface ItemArgs extends VirtualArgs {
    num: number;
}

@ccclass
export default class ListItem extends VirtualItem<ItemArgs> {
    @property(cc.Label) lab: cc.Label = null;

    /**
     * @override
     */
    public onRefresh(args: ItemArgs) {
        this.lab.string = `idx: ${this.dataIdx}`;
        cc.log(`[ListItem.onRefresh] idx: ${this.dataIdx}, args.num: ${args.num}`);
    }

    /**
     * @override
     */
    public onRefreshOthers(labNode: cc.Node) {
    }
}
