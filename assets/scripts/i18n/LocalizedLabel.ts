import { EventName } from "../common/const/EventName";
import { eventsOnLoad, preloadEvent } from "../common/util/Events";
import I18n from "./I18n";

const { ccclass, property, executeInEditMode, menu } = cc._decorator;

@ccclass
@eventsOnLoad
@executeInEditMode
@menu('Framework/I18N/LocalizedLabel')
export default class LocalizedLabel extends cc.Component {
    @property(cc.String) private _textKey: string = '';

    @property({ type: cc.String, tooltip: 'i18n key' })
    public get TextKey() {
        return this._textKey;
    }
    public set TextKey(key: string) {
        this._textKey = key;
        this.updateLabel();
    }

    /**
     * 用于正则替换的配置
     */
    private _option: any = null;

    private _label: cc.Label | cc.RichText = null;
    public get label() {
        if (!this._label) {
            this._label = this.node.getComponent(cc.Label) || this.node.getComponent(cc.RichText);
            if (!this._label) {
                cc.error('Failed to update localized label, label component is invalid!');
                return null;
            }
        }
        return this._label;
    }

    protected onLoad() {
        try {
            I18n.init();
            this.updateLabel();
        } catch (err) {
            cc.error(err);
        }
    }

    protected update() {
        if (CC_EDITOR) {
            if (this.label.string) {
                let key = I18n.getKeyByValue(this.label.string);
                if (key) {
                    this.TextKey = key;
                }
            }
        }
    }

    /**
     * 更新语言
     */
    @preloadEvent(EventName.UPDATE_LOCALIZED_CMPT)
    public updateLabel() {
        let localizedString = I18n.getText(this._textKey, this._option);
        if (localizedString) {
            this.label.string = localizedString;
        }
    }

    /**
     * 设置语言与配置
     * @param key
     * @param option
     */
    public setTextKeyAndOption(key: string, option: any) {
        this._textKey = key;
        this._option = option ? option : null;
        this.updateLabel();
    }

    /**
     * 仅设置配置
     * @param option
     */
    public setOption(option: any) {
        this._option = option ? option : null;
        this.updateLabel();
    }

    /**
     * 清除key
     */
    public clear() {
        this.label.string = '';
        this.TextKey = '';
    }
}
