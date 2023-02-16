import DialogBase from "../../common/cmpt/base/DialogBase";
import I18nLabel from "../../common/cmpt/ui/i18n/I18nLabel";
import { DirUrl } from "../../common/const/Url";
import I18n, { LangType } from "../../common/util/I18n";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgI18N extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgI18N";

    @property(I18nLabel) text1: I18nLabel = null;
    @property(I18nLabel) text2: I18nLabel = null;

    /**
     * @override
     */
    public open() {
        this.text1.setOption({ num: 10 });
        this.text2.setOption(10, "---");
    }

    private onClickZh() {
        I18n.switch(LangType.ZH);
    }

    private onClickEn() {
        I18n.switch(LangType.EN);
    }
}
