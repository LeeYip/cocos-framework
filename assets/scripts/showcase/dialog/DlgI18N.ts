import DialogBase from "../../common/cmpt/base/DialogBase";
import I18n, { LangType } from "../../i18n/I18n";
import LocalizedLabel from "../../i18n/LocalizedLabel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgI18N extends DialogBase {
    public static pUrl: string = 'DlgI18N';

    @property(LocalizedLabel) Text1: LocalizedLabel = null;

    /**
     * @override
     */
    public open() {
        this.Text1.setOption({ num: 10 });
    }

    private onClickZh() {
        I18n.switch(LangType.ZH);
    }

    private onClickEn() {
        I18n.switch(LangType.EN);
    }
}
