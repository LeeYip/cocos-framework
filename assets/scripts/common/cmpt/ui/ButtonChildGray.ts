import { ButtonHackEvent, ButtonState } from "../../hack/ButtonHack";
import Tool from "../../util/Tool";

const { ccclass, property, menu, requireComponent, executeInEditMode } = cc._decorator;

/**
 * 根据button组件过渡状态，置灰子节点
 */
@ccclass
@executeInEditMode
@requireComponent(cc.Button)
@menu('Framework/UI组件/ButtonChildGray')
export default class ButtonChildGray extends cc.Component {

    @property({ type: cc.Node, tooltip: CC_DEV && '需要同步置灰的关联节点' }) public RelatedNodes: cc.Node[] = [];
    @property(cc.Material) public NormalMaterial: cc.Material = null;
    @property(cc.Material) public GrayMaterial: cc.Material = null;

    protected onLoad(): void {
        this.node.on(ButtonHackEvent.STATE_CHANGE, this.onStateChange, this);
    }

    private onStateChange(state: ButtonState): void {
        if (state === ButtonState.DISABLED) {
            if (!this.GrayMaterial) {
                this.GrayMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
            }
            let cb = (n: cc.Node): void => {
                let rc = n.getComponent(cc.RenderComponent);
                if (rc && (rc instanceof cc.Sprite || rc instanceof cc.Label)) {
                    rc.setMaterial(0, this.GrayMaterial);
                }
            };
            Tool.nodeRecursive(this.node.children, cb);
            Tool.nodeRecursive(this.RelatedNodes, cb);
        } else {
            if (!this.NormalMaterial) {
                this.NormalMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
            }
            let cb = (n: cc.Node): void => {
                let rc = n.getComponent(cc.RenderComponent);
                if (rc && (rc instanceof cc.Sprite || rc instanceof cc.Label)) {
                    rc.setMaterial(0, this.NormalMaterial);
                }
            };
            Tool.nodeRecursive(this.node.children, cb);
            Tool.nodeRecursive(this.RelatedNodes, cb);
        }
    }
}
