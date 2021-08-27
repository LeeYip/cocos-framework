import { SCALE_TWEEN, Tween } from "../../util/Tween";

const { ccclass, property, menu, disallowMultiple } = cc._decorator;

/**
 * 节点振动
 */
@ccclass
@disallowMultiple
@menu('Framework/UI组件/ShakeNode')
export default class ShakeNode extends cc.Component {
    @property({ tooltip: CC_DEV && '振动幅度' })
    public ShakePower: number = 5;

    @property({ tooltip: CC_DEV && '振动周期，单位：秒' })
    public ShakeTime: number = 0.16;

    @property({
        tooltip: CC_DEV && '变化速度是否受到timeScale的影响'
    })
    public TimeScale: boolean = false;

    private _tween: Tween<cc.Node> = null;

    /**
     * 振动
     * @param duration 振动时长，单位秒
     */
    public shake(duration: number = 0.5) {
        if (this._tween || duration <= 0 || this.ShakePower <= 0 || this.ShakeTime <= 0) {
            return;
        }

        let sv = cc.v2(0, this.ShakePower);
        let xArr: number[] = [];
        let yArr: number[] = [];
        for (let i = 0; i < 8; i++) {
            let v = sv.rotate(Math.PI / 4 * (i * 3));
            xArr.push(v.x);
            yArr.push(v.y);
        }

        this._tween = this.TimeScale ? new Tween(this.node, SCALE_TWEEN) : new Tween(this.node);
        this._tween.to({ x: xArr, y: yArr }, this.ShakeTime * 1000)
            .repeat(Number.POSITIVE_INFINITY)
            .start();

        // duration时间后停止振动
        let dObj = { progress: 0 };
        let dTween = this.TimeScale ? new Tween(dObj, SCALE_TWEEN) : new Tween(dObj);
        dTween.to({ progress: 1 }, duration * 1000)
            .onComplete(() => {
                this._tween.stop();
                this._tween = null;
                this.node.setPosition(0, 0);
            })
            .start();
    }
}
