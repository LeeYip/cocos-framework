import { ButtonHackEvent, ButtonState } from "../../hack/ButtonHack";
import Tool from "../../util/Tool";

const { ccclass, property, menu, requireComponent } = cc._decorator;

/**
 * 根据button组件过渡状态，置灰子节点
 */
@ccclass
@requireComponent(cc.Button)
@menu('Framework/UI组件/ButtonChildGray')
export default class ButtonChildGray extends cc.Component {

    @property({ type: cc.Node, tooltip: CC_DEV && '需要同步置灰的关联节点' }) private relatedNodes: cc.Node[] = [];
    @property(cc.Material) private normalMaterial: cc.Material = null;
    @property(cc.Material) private grayMaterial: cc.Material = null;

    protected onLoad(): void {
        this.node.on(ButtonHackEvent.STATE_CHANGE, this.onStateChange, this);
    }

    private onStateChange(state: ButtonState): void {
        if (state === ButtonState.DISABLED) {
            if (!this.grayMaterial) {
                this.grayMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
            }
            let cb = (n: cc.Node): void => {
                let rc = n.getComponent(cc.RenderComponent);
                if (rc) {
                    rc.setMaterial(0, this.grayMaterial);
                }
            };
            Tool.nodeRecursive(this.node.children, cb);
            Tool.nodeRecursive(this.relatedNodes, cb);
        } else {
            if (!this.normalMaterial) {
                this.normalMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
            }
            let cb = (n: cc.Node): void => {
                let rc = n.getComponent(cc.RenderComponent);
                if (rc) {
                    rc.setMaterial(0, this.normalMaterial);
                }
            };
            Tool.nodeRecursive(this.node.children, cb);
            Tool.nodeRecursive(this.relatedNodes, cb);
        }
    }
}
