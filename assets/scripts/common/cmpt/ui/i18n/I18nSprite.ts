import { EventName } from "../../../const/EventName";
import { eventsOnLoad, preloadEvent } from "../../../util/Events";
import I18n, { LangType } from "../../../util/I18n";
import ResSprite from "../res/ResSprite";

const { ccclass, menu, requireComponent } = cc._decorator;

@ccclass
@eventsOnLoad()
@requireComponent(ResSprite)
@menu("Framework/I18N/I18nSprite")
export default class I18nSprite extends cc.Component {
    private _sprite: ResSprite = null;
    private _imageKey: string = "";
    /** 图片名 */
    public get imageKey(): string { return this._imageKey; }
    public set imageKey(v: string) {
        if (this._imageKey === v) {
            return;
        }
        this._imageKey = v;
        this.updateSprite();
    }

    protected onLoad(): void {
        try {
            I18n.init();

            this._sprite = this.getComponent(ResSprite);
            if (this._sprite.spriteFrame) {
                this.imageKey = this._sprite.spriteFrame.name;
            }
        } catch (err) {
            cc.error(err);
        }
    }

    @preloadEvent(EventName.UPDATE_LOCALIZED_CMPT)
    public updateSprite(): void {
        if (!this.imageKey) {
            return;
        }

        let url = "";
        switch (I18n.curLang) {
            case LangType.ZH:
                url = "textures/localizedImage/zh/";
                break;
            case LangType.EN:
                url = "textures/localizedImage/en/";
                break;
            default:
                return;
        }
        url += this.imageKey;
        this._sprite.setSpriteFrame(url);
    }
}
