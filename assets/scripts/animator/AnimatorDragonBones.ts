import AnimatorBase, { AnimationPlayer } from "./core/AnimatorBase";
import AnimatorStateLogic from "./core/AnimatorStateLogic";

const { ccclass, property, requireComponent, disallowMultiple, menu } = cc._decorator;

/** 
 * DragonBones状态机组件
 */
@ccclass
@disallowMultiple
@requireComponent(dragonBones.ArmatureDisplay)
@menu('Framework/Animator/AnimatorDragonBones')
export default class AnimatorDragonBones extends AnimatorBase {
    /** DragonBones组件 */
    private _dragonBones: dragonBones.ArmatureDisplay = null;

    protected start() {
        if (!this.playOnStart || this._hasInit) {
            return;
        }
        this._hasInit = true;

        this._dragonBones = this.getComponent(dragonBones.ArmatureDisplay);
        this._dragonBones.addEventListener(dragonBones.EventObject.COMPLETE, this.onAnimFinished, this);

        if (this.assetRawUrl !== null) {
            this.initJson(this.assetRawUrl.json);
        }
    }

    /**
     * 手动初始化状态机，可传入0-3个参数，类型如下
     * - onStateChangeCall 状态切换时的回调
     * - stateLogicMap 各个状态逻辑控制
     * - animationPlayer 自定义动画控制
     * @override
     */
    public onInit(...args: Array<Map<string, AnimatorStateLogic> | ((fromState: string, toState: string) => void) | AnimationPlayer>) {
        if (this.playOnStart || this._hasInit) {
            return;
        }
        this._hasInit = true;

        this.initArgs(...args);

        this._dragonBones = this.getComponent(dragonBones.ArmatureDisplay);
        this._dragonBones.addEventListener(dragonBones.EventObject.COMPLETE, this.onAnimFinished, this);

        if (this.assetRawUrl !== null) {
            this.initJson(this.assetRawUrl.json);
        }
    }

    /**
     * 播放动画
     * @override
     * @param animName 动画名
     * @param loop 是否循环播放
     */
    protected playAnimation(animName: string, loop: boolean) {
        animName && this._dragonBones.playAnimation(animName, loop ? 0 : -1);
    }

    /**
     * 缩放动画播放速率
     * @override
     * @param scale 缩放倍率
     */
    protected scaleTime(scale: number) {
        this._dragonBones.timeScale = scale;
    }
}
