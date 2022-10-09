import Res from "../../../util/Res";

const { ccclass, menu, disallowMultiple, requireComponent } = cc._decorator;

/**
 * 精灵组件，自动管理资源的引用计数
 */
@ccclass
@disallowMultiple
@requireComponent(cc.Sprite)
@menu("Framework/UI组件/ResSprite")
export default class ResSprite extends cc.Component {
    // 动态加载的资源
    private _asset: cc.SpriteFrame | cc.SpriteAtlas = null;

    private _sprite: cc.Sprite = null;
    private get sprite(): cc.Sprite {
        if (!this._sprite) {
            this._sprite = this.getComponent(cc.Sprite);
        }
        return this._sprite;
    }

    public get spriteFrame(): cc.SpriteFrame {
        return this.sprite.spriteFrame;
    }
    public set spriteFrame(v: cc.SpriteFrame) {
        if (this.sprite.spriteFrame === v) {
            return;
        }
        v.addRef();
        this._asset?.decRef();
        this._asset = v;
        this.sprite.spriteFrame = v;
    }

    protected onDestroy(): void {
        this._asset?.decRef();
    }

    /**
     * 加载并设置spriteFrame
     * @param url 图片或图集路径，规则同Res加载路径
     * @param key 如果需要加载的url为图集时，需传入图集的key
     */
    public async setSpriteFrame(url: string, key: string = ""): Promise<void> {
        let type = key ? cc.SpriteAtlas : cc.SpriteFrame;
        let result = Res.get(url, type) || await Res.load(url, type);
        if (result instanceof type) {
            this.spriteFrame = result instanceof cc.SpriteAtlas ? result.getSpriteFrame(key) : result;
        }
    }
}
