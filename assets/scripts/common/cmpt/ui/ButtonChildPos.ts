import { ButtonHackEvent, ButtonState } from "../../hack/ButtonHack";

const { ccclass, property, menu, requireComponent } = cc._decorator;

/**
 * 根据button组件过渡状态，移动子节点坐标
 */
@ccclass
@requireComponent(cc.Button)
@menu('Framework/UI组件/ButtonChildPos')
export default class ButtonChildPos extends cc.Component {
    @property({ tooltip: CC_DEV && '普通状态下按钮子节点坐标' }) public normal: cc.Vec2 = cc.v2(0, 0);
    @property({ tooltip: CC_DEV && '按下状态下按钮子节点坐标' }) public pressed: cc.Vec2 = cc.v2(0, 0);
    @property({ tooltip: CC_DEV && '悬停状态下按钮子节点坐标' }) public hover: cc.Vec2 = cc.v2(0, 0);
    @property({ tooltip: CC_DEV && '禁用状态下按钮子节点坐标' }) public disabled: cc.Vec2 = cc.v2(0, 0);

    protected onLoad(): void {
        this.node.on(ButtonHackEvent.STATE_CHANGE, this.onStateChange, this);
    }

    private onStateChange(state: ButtonState): void {
        let pos = cc.v2(0, 0);
        switch (state) {
            case ButtonState.NORMAL:
                pos = this.normal;
                break;
            case ButtonState.PRESSED:
                pos = this.pressed;
                break;
            case ButtonState.HOVER:
                pos = this.hover;
                break;
            case ButtonState.DISABLED:
                pos = this.disabled;
                break;
            default:
                break;
        }
        this.node.children.forEach((e) => {
            e.setPosition(pos);
        });
    }
}
