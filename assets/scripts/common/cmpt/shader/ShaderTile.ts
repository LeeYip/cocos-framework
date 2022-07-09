const { ccclass, property, menu, disallowMultiple, executeInEditMode } = cc._decorator;

@ccclass
@disallowMultiple
@executeInEditMode
@menu("Framework/Shader/ShaderTile")
export default class ShaderTile extends cc.Component {
    @property({ tooltip: CC_DEV && "uv坐标缩放倍数" })
    public scale: cc.Vec2 = new cc.Vec2(1, 1);
    @property({ tooltip: CC_DEV && "uv坐标偏移值" })
    public offset: cc.Vec2 = new cc.Vec2(0, 0);

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
        this.mat.setProperty("tile", new cc.Vec4(this.scale.x, this.scale.y, this.offset.x, this.offset.y));
    }
}
