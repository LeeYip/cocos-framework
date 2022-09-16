import { EventName } from "../../../const/EventName";
import { eventsOnLoad, preloadEvent } from "../../../util/Events";

const { ccclass, property, menu, executeInEditMode } = cc._decorator;

/**
 * - 适配组件，使节点与设计分辨率size保持一致，不影响节点位置
 * - 不使用cc.Widget是因为某些需要改变节点position的情况下会产生冲突
 */
@ccclass
@eventsOnLoad()
@executeInEditMode
@menu("Framework/UI组件/AdaptSize")
export default class AdaptSize extends cc.Component {
    protected onLoad(): void {
        this.adapt();
    }

    @preloadEvent(EventName.RESIZE)
    private adapt(): void {
        if (CC_EDITOR) {
            this.node.width = cc["engine"].getDesignResolutionSize().width;
            this.node.height = cc["engine"].getDesignResolutionSize().height;
        } else {
            this.node.width = cc.winSize.width;
            this.node.height = cc.winSize.height;
        }
    }
}
