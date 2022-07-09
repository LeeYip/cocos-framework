import MultiSprite from "./MultiSprite";
import { MultiTextureManager } from "./MultiTextureManager";

const { ccclass, property, requireComponent, menu, inspector } = cc._decorator;

/**
 * Multi-Texture ID，必须搭配MultiSprite使用，不需要在代码中主动调用此脚本的接口
 */
@ccclass
export default class MultiTextureIdx extends cc.Component {
    @property
    private _textureIdx: number = 0;
    /** 当前渲染组件使用的纹理ID */
    @property({ type: cc.Integer, range: [0, MultiTextureManager.MAX_TEXTURE_NUM - 1] })
    public get textureIdx(): number { return this._textureIdx; }
    public set textureIdx(v: number) {
        this._textureIdx = cc.misc.clampf(v, 0, MultiTextureManager.MAX_TEXTURE_NUM - 1);
        this.multiSprite["setVertsDirty"]();
    }

    private _multiSprite: MultiSprite = null;
    private get multiSprite(): MultiSprite {
        if (!this._multiSprite) {
            this._multiSprite = this.getComponent(MultiSprite);
        }
        return this._multiSprite;
    }
}
