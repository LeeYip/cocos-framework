import VirtualItem from "../../common/cmpt/ui/scrollList/VirtualItem";
import { ItemArgs } from "./ListItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ListItem2 extends VirtualItem<ItemArgs> {

    @property(cc.Node) bg: cc.Node = null;
    @property(cc.Label) lab: cc.Label = null;

    /**
     * @override
     */
    public onRefresh(args: ItemArgs) {
        this.lab.string = `idx: ${this.dataIdx}`;
        this.node.height = args.num;
        this.bg.height = this.node.height - 20;
        cc.log(`[ListItem2.onRefresh] idx: ${this.dataIdx}, args.num: ${args.num}`);
    }

    /**
     * @override
     */
    public onRefreshOthers(labNode: cc.Node) {
    }
}
