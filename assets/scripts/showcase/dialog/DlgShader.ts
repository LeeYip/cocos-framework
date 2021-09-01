import DialogBase from "../../common/cmpt/base/DialogBase";
import Timer from "../../common/cmpt/base/Timer";
import ShaderFill from "../../common/cmpt/shader/ShaderFill";
import ShaderTile from "../../common/cmpt/shader/ShaderTile";
import { Easing, SCALE_TWEEN, Tween } from "../../common/util/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgShader extends DialogBase {
    public static pUrl: string = 'DlgShader';

    @property(ShaderTile) Tile: ShaderTile = null;
    @property(ShaderFill) Fill: ShaderFill = null;

    private _tween: Tween<any> = null;
    private _sx: number = 2;

    protected onDestroy() {
        this._tween?.stop();
    }

    /**
     * @override
     */
    public open() {
        this._tween = new Tween(this.Fill, SCALE_TWEEN)
            .to({ FillPhase: [1, 0] }, 1000)
            .repeat(1000)
            .easing(Easing.Quadratic.In)
            .onUpdate(() => {
                this.Fill.updateShader();
            })
            .start();
    }

    protected update() {
        this.Tile.Scale.x += Timer.scaleDt * this._sx;
        if (this.Tile.Scale.x >= 10) {
            this._sx = -2;
        } else if (this.Tile.Scale.x <= 1) {
            this._sx = 2;
        }
        this.Tile.Offset.x -= Timer.scaleDt * 5;
        this.Tile.updateShader();
    }
}
