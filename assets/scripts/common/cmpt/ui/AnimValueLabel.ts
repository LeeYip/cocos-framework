import AnimValue from "./AnimValue";

const { ccclass, property, menu, requireComponent, executeInEditMode } = cc._decorator;

/**
 * 数值渐变的数字
 */
@ccclass
@executeInEditMode
@requireComponent(cc.Label)
@menu('Framework/UI组件/AnimValueLabel')
export default class AnimValueLabel extends AnimValue {

    private _label: cc.Label = null;
    public get label(): cc.Label {
        if (!this._label) this._label = this.getComponent(cc.Label);
        return this._label;
    }

    /**
     * @override
     */
    protected onAnimUpdate(): void {
        this.label.string = `${Math.round(this.curValue)}`;
    }

    /**
     * @override
     */
    protected setValueImmediately(end: number): void {
        super.setValueImmediately(end);
        this.label.string = `${Math.round(this.curValue)}`;
    }
}
