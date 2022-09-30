import DialogBase from "../../common/cmpt/base/DialogBase";
import Timer from "../../common/cmpt/base/Timer";
import ShaderFill from "../../common/cmpt/shader/ShaderFill";
import ShaderTile from "../../common/cmpt/shader/ShaderTile";
import { DirUrl } from "../../common/const/Url";
import { Easing, SCALE_TWEEN, Tween } from "../../common/util/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgShader extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgShader";

    @property(ShaderTile) tile: ShaderTile = null;
    @property(ShaderFill) fill: ShaderFill = null;

    private _tween: Tween<any> = null;
    private _sx: number = 2;

    /**
     * @override
     */
    public open() {
        this._tween = new Tween(this.fill, SCALE_TWEEN)
            .to({ fillPhase: [1, 0] }, 1000)
            .repeat(1000)
            .easing(Easing.Quadratic.In)
            .onUpdate(() => {
                this.fill.updateShader();
            })
            .start();
    }

    protected update() {
        this.tile.scale.x += Timer.scaleDt * this._sx;
        if (this.tile.scale.x >= 10) {
            this._sx = -2;
        } else if (this.tile.scale.x <= 1) {
            this._sx = 2;
        }
        this.tile.offset.x -= Timer.scaleDt * 5;
        this.tile.updateShader();
    }
}
