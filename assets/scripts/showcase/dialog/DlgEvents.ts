import DialogBase from "../../common/cmpt/base/DialogBase";
import { EventName } from "../../common/const/EventName";
import Events, { preloadEvent } from "../../common/util/Events";
import Tool from "../../common/util/Tool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgEvents extends DialogBase {
    public static pUrl: string = 'DlgEvents';

    @property(cc.Label) Lab1: cc.Label = null;

    protected onEnable() {
        Events.targetOn(this);
    }

    protected onDisable() {
        Events.targetOff(this);
    }

    private async onClickEmit() {
        await Events.emitAsync(EventName.EVENT_TEST1, '触发了事件1，请等待事件2');
        Events.emit(EventName.EVENT_TEST2, '触发了事件2');
    }

    @preloadEvent(EventName.EVENT_TEST1)
    private async eventTest1(str: string) {
        this.Lab1.string = str;
        await Tool.waitCmpt(this, 1);
    }

    @preloadEvent(EventName.EVENT_TEST2)
    private eventTest2(str: string) {
        this.Lab1.string = str;
    }
}
