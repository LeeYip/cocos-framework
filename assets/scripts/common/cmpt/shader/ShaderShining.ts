import Timer from "../base/Timer";

const { ccclass, property, menu, disallowMultiple, executeInEditMode } = cc._decorator;

@ccclass
@disallowMultiple
@executeInEditMode
@menu("Framework/Shader/ShaderShining")
export default class ShaderShining extends cc.Component {
    @property({ tooltip: CC_DEV && "流光速度" })
    public speed: number = 1;
    @property({ tooltip: CC_DEV && "流光斜率" })
    public slope: number = 1;
    @property({ tooltip: CC_DEV && "流光宽度", range: [0, Number.MAX_SAFE_INTEGER] })
    public len: number = 0.25;
    @property({ tooltip: CC_DEV && "流光强度", range: [0, Number.MAX_SAFE_INTEGER] })
    public strength: number = 2;
    @property({ tooltip: CC_DEV && "两次流光动画之间的间隔时间", range: [0, Number.MAX_SAFE_INTEGER] })
    public interval: number = 1;
    @property({ tooltip: CC_DEV && "流光速度是否受到timeScale的影响" })
    public timeScale: boolean = false;

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
        this.updateShader();
    }

    public updateShader(): void {
        this.mat.setProperty("shiningData", new cc.Vec4(this.speed, this.slope, this.len, this.interval));
        this.mat.setProperty("extra", new cc.Vec4(this.timeScale ? Timer.scaleGameSec : Timer.gameSec, this.strength));
    }
}
