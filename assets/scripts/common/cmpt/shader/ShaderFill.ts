const { ccclass, property, menu, disallowMultiple, executeInEditMode } = cc._decorator;

@ccclass
@disallowMultiple
@executeInEditMode
@menu('Framework/Shader/ShaderFill')
export default class ShaderFill extends cc.Component {
    @property({ tooltip: CC_DEV && '填充颜色' })
    public FillColor: cc.Color = new cc.Color();
    @property({ tooltip: CC_DEV && '填充率', range: [0, 1] })
    public FillPhase: number = 0;

    private _mat: cc.Material = null;
    public get mat(): cc.Material {
        if (!this._mat) {
            this._mat = this.getComponent(cc.RenderComponent).getMaterial(0);
        }
        return this._mat;
    }

    protected start(): void {
        this.updateShader();
    }

    protected update(): void {
        if (CC_EDITOR) {
            this.updateShader();
        }
    }

    public updateShader(): void {
        this.mat.setProperty('fillColor', this.FillColor);
        this.mat.setProperty('fillPhase', this.FillPhase);
    }
}
