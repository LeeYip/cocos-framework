import DialogBase from "../../common/cmpt/base/DialogBase";
import VirtualList from "../../common/cmpt/ui/VirtualList";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgVirtualList extends DialogBase {
    public static pUrl: string = 'DlgVirtualList';

    @property(VirtualList) List: VirtualList = null;

    /**
     * @override
     */
    public open() {
        for (let i = 0; i < 1000; i++) {
            this.List.push(i);
        }
    }
}
