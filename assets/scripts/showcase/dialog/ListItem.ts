import VirtualItem from "../../common/cmpt/ui/VirtualItem";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ListItem extends VirtualItem {
    /**
     * @override
     */
    public onInit(i: number) {
        
    }

    /**
     * @override
     */
    public setOtherNode(labNode: cc.Node) {
        labNode.getComponent(cc.Label).string = `idx: ${this.DataIdx}`;
    }
}
