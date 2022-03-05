import Res from "../../util/Res";

const { ccclass, menu, disallowMultiple, requireComponent } = cc._decorator;

/**
 * 精灵组件，自动管理资源的引用计数
 */
@ccclass
@disallowMultiple
@requireComponent(cc.Sprite)
@menu('Framework/UI组件/ResSprite')
export default class ResSprite extends cc.Component {
    // 动态加载的资源
    private _asset: cc.SpriteFrame | cc.SpriteAtlas = null;

    private _sprite: cc.Sprite = null;
    private get sprite() {
        if (!this._sprite) {
            this._sprite = this.getComponent(cc.Sprite);
        }
        return this._sprite;
    }

    public get spriteFrame() {
        return this.sprite.spriteFrame;
    }

    protected onDestroy(): void {
        this._asset?.decRef();
    }

    /**
     * 设置spriteFrame
     * @param url 
     * @param key 如果需要加载的url为图集时，需传入图集的key
     */
    public async setSpriteFrame(url: string, key: string = '') {
        let type = key ? cc.SpriteAtlas : cc.SpriteFrame;
        let result = Res.get(url, type) || await Res.load(url, type);
        if (result instanceof type) {
			result.addRef();
			this._asset?.decRef();
			this._asset = result;
            this.sprite.spriteFrame = result instanceof cc.SpriteAtlas ? result.getSpriteFrame(key) : result;
        }
    }
}
