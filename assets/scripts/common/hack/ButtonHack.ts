// 基于CocosCreator2.x 按钮组件hack代码

export enum ButtonHackEvent {
    /** 按钮状态变更 */
    STATE_CHANGE = "ButtonHackEvent-STATE_CHANGE",
}

export enum ButtonState {
    NORMAL = 0,
    HOVER = 1,
    PRESSED = 2,
    DISABLED = 3,
}

// @ts-ignore
cc.Button.prototype._applyTransition = function (state: any) {
    let transition = this.transition;
    if (transition === cc.Button.Transition.COLOR) {
        this._updateColorTransition(state);
    } else if (transition === cc.Button.Transition.SPRITE) {
        this._updateSpriteTransition(state);
    } else if (transition === cc.Button.Transition.SCALE) {
        this._updateScaleTransition(state);
    }

    // 状态变更通知
    this.node.emit(ButtonHackEvent.STATE_CHANGE, state);
};
