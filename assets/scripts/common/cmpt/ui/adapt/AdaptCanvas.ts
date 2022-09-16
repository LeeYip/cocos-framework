import { EventName } from "../../../const/EventName";
import Events, { eventsOnLoad, preloadEvent } from "../../../util/Events";

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

// 仅web有效
cc.view.setResizeCallback(() => {
    Events.emit(EventName.RESIZE);
});

/**
 * 分辨率适配组件，保证设计分辨率区域全部都能显示
 */
@ccclass
@eventsOnLoad()
@disallowMultiple
@menu("Framework/UI组件/AdaptCanvas")
export default class AdaptCanvas extends cc.Component {
    protected onLoad(): void {
        this.adapt();
    }

    @preloadEvent(EventName.RESIZE)
    private adapt(): void {
        let resolutionRatio = cc.Canvas.instance.designResolution.width / cc.Canvas.instance.designResolution.height;
        let ratio = cc.winSize.width / cc.winSize.height;
        if (ratio > resolutionRatio) {
            cc.Canvas.instance.fitHeight = true;
            cc.Canvas.instance.fitWidth = false;
        } else {
            cc.Canvas.instance.fitHeight = false;
            cc.Canvas.instance.fitWidth = true;
        }
    }
}
