import DialogBase from "../../common/cmpt/base/DialogBase";
import { MultiTextureManager } from "../../common/cmpt/ui/MultiSprite/MultiTextureManager";
import { ResUrl } from "../../common/const/Url";
import Res from "../../common/util/Res";

const { ccclass, property } = cc._decorator;

@ccclass
export default class DlgMultiTexture extends DialogBase {
    public static pUrl: string = "DlgMultiTexture";

    @property(cc.Node)
    item1: cc.Node = null;
    @property(cc.Node)
    item2: cc.Node = null;

    /**
     * @override
     */
    public async open() {
        let arr = [ResUrl.ATLAS.EN, ResUrl.ATLAS.ZH];

        // 动态添加需要合批的纹理
        let atlas = await Res.load<cc.SpriteAtlas>(arr[0], cc.SpriteAtlas);
        MultiTextureManager.setTexture(0, atlas.getTexture());

        let node1 = Res.instantiate(this.item1);
        this.node.getChildByName("bg").addChild(node1);
        node1.setPosition(0, 0);
        let node2 = Res.instantiate(this.item2);
        this.node.getChildByName("bg").addChild(node2);
        node2.setPosition(0, 0);

        // 动态添加需要合批的纹理
        atlas = await Res.load<cc.SpriteAtlas>(arr[1], cc.SpriteAtlas);
        MultiTextureManager.setTexture(1, atlas.getTexture());

        node1 = Res.instantiate(this.item1);
        this.node.getChildByName("bg").addChild(node1);
        node1.setPosition(10, 10);
        node2 = Res.instantiate(this.item2);
        this.node.getChildByName("bg").addChild(node2);
        node2.setPosition(10, 10);
    }
}
