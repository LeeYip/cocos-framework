import { EventName } from "../common/const/EventName";
import { eventsOnLoad, preloadEvent } from "../common/util/Events";
import Res from "../common/util/Res";
import I18n, { LangType } from "./I18n";

const { ccclass, property, executeInEditMode, menu, requireComponent } = cc._decorator;

@ccclass
@eventsOnLoad
@executeInEditMode
@requireComponent(cc.Sprite)
@menu('Framework/I18N/LocalizedSprite')
export default class LocalizedSprite extends cc.Component {
    private _sprite: cc.Sprite = null;
    private _imageKey: string = '';
    /** 图片名 */
    public get imageKey() { return this._imageKey; }
    public set imageKey(v: string) {
        if (this._imageKey === v) {
            return;
        }
        this._imageKey = v;
        this.updateSprite();
    }

    protected onLoad() {
        try {
            I18n.init();

            this._sprite = this.getComponent(cc.Sprite);
            if (this._sprite.spriteFrame) {
                this.imageKey = this._sprite.spriteFrame.name;
            }
        } catch (err) {
            cc.error(err);
        }
    }

    @preloadEvent(EventName.UPDATE_LOCALIZED_CMPT)
    public async updateSprite() {
        let url = '';
        switch (I18n.curLang) {
            case LangType.ZH:
                url = 'textures/localizedImage/zh/';
                break;
            case LangType.EN:
                url = 'textures/localizedImage/en/';
                break;
            default:
                return;
        }
        url += this.imageKey;

        if (CC_EDITOR) {
            // let uuid = Editor.assetdb.remote.urlToUuid(`db://assets/resources/${url}.png`);
            // cc.log(uuid);
            // cc.loader.load({ type: 'uuid', uuid: uuid }, (err: any, texture: cc.Texture2D) => {
            //     if (err) {
            //         cc.error(`error uuid: ${uuid}`);
            //         return;
            //     }
            //     this._sprite.spriteFrame = null;
            //     this._sprite.spriteFrame = new cc.SpriteFrame(texture);
            // });
        } else {
            let sf: cc.SpriteFrame = await Res.load(url, cc.SpriteFrame);
            if (sf) {
                this._sprite.spriteFrame = sf;
            }
        }
    }
}
