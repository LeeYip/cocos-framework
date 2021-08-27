const { ccclass, property, menu, disallowMultiple, executeInEditMode } = cc._decorator;

@ccclass
@disallowMultiple
@executeInEditMode
@menu('Framework/Shader/ShaderTile')
export default class ShaderTile extends cc.Component {
    @property({ tooltip: CC_DEV && 'uv坐标缩放倍数' })
    public Scale: cc.Vec2 = new cc.Vec2(1, 1);
    @property({ tooltip: CC_DEV && 'uv坐标偏移值' })
    public Offset: cc.Vec2 = new cc.Vec2(0, 0);

    private _mat: cc.Material = null;
    public get mat() {
        if (!this._mat) {
            this._mat = this.getComponent(cc.RenderComponent).getMaterial(0);
        }
        return this._mat;
    }

    protected start() {
        this.updateShader();
    }

    protected update() {
        if (CC_EDITOR) {
            this.updateShader();
        }
    }

    public updateShader() {
        this.mat.setProperty('tile', new cc.Vec4(this.Scale.x, this.Scale.y, this.Offset.x, this.Offset.y));
    }
}
