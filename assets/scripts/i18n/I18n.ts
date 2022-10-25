import { EventName } from "../common/const/EventName";
import Events from "../common/util/Events";
import Tool from "../common/util/Tool";
import En from "./config/En";
import Zh from "./config/Zh";

/**
 * 语言类型
 */
export enum LangType {
    NONE = "",
    ZH = "zh",
    EN = "en"
}

/**
 * 多语言控制类
 */
export default class I18n {
    private static _init: boolean = false;

    /** 语言表 */
    private static _phrases: any = null;

    private static _curLang: LangType = LangType.NONE;
    /* 当前语言类型 */
    public static get curLang(): LangType { return this._curLang; }

    /**
     * 初始化语言
     * @param language
     */
    public static init(language: LangType = LangType.NONE): void {
        if (this._init) {
            return;
        }
        this._init = true;
        let lang = language || cc.sys.language;
        this.switch(lang as LangType);
    }

    /**
     * 切换语言
     * @param language
     */
    public static switch(language: LangType): void {
        if (this._curLang === language) {
            return;
        }

        this._curLang = language;
        switch (language) {
            case LangType.ZH:
                this._phrases = Zh;
                break;
            case LangType.EN:
                this._phrases = En;
                break;
            default:
                this._curLang = LangType.EN;
                this._phrases = En;
                break;
        }
        this.updateLocalizedCmpt();
    }

    /**
    * 更新所有多语言组件
    */
    public static updateLocalizedCmpt(): void {
        Events.emit(EventName.UPDATE_LOCALIZED_CMPT);
    }


    /**
     * 通过语言表value获取对应的key
     * @param value 语言表的value
     */
    public static getKeyByValue(value: string): string {
        if (!this._phrases) {
            cc.error(`[I18n.getKeyByValue] 未正确初始化`);
            return "";
        }
        for (let key in this._phrases) {
            if (this._phrases[key] === value) {
                return key;
            }
        }
        return "";
    }

    /**
     * 通过key获取语言表中的字符串
     * @param key 语言表中的key
     * @param option 用于替换的数据，可以传键值对，也可以按顺序传参
     * @example
     * // 语言表 {"test": "test %{arg1} %{arg2} !!!"}
     * I18n.getText("test", {arg1: "somthing", arg2: 2}); // "test somthing 2 !!!"
     * I18n.getText("test", "somthing", 2); // "test somthing 2 !!!"
     */
    public static getText(key: string, ...option: [{ [k: string]: string | number }] | Array<string | number>): string {
        if (!this._phrases) {
            cc.error(`[I18n.getText] 未正确初始化`);
            return "";
        }
        if (!key) {
            return "";
        }

        let text: string = this._phrases.hasOwnProperty(key) ? this._phrases[key] : key;
        text = Tool.formatString(text, ...option);
        return text;
    }
}
