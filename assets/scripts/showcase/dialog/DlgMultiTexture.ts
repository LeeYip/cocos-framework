import DialogBase from "../../common/cmpt/base/DialogBase";
import MultiSprite from "../../common/cmpt/ui/multiTexture/MultiSprite";
import { MultiTextureManager } from "../../common/cmpt/ui/multiTexture/MultiTextureManager";
import { DirUrl, ResUrl } from "../../common/const/Url";
import Res from "../../common/util/Res";

const { ccclass, property } = cc._decorator;

// 原生平台默认关闭动态合图，在此为了测试强制开启
if (CC_NATIVERENDERER) {
    cc.game.once(cc.game.EVENT_ENGINE_INITED, () => {
        cc.macro.CLEANUP_IMAGE_CACHE = false;
        cc.dynamicAtlasManager.enabled = true;
    });
}

@ccclass
export default class DlgMultiTexture extends DialogBase {
    public static pUrl: string = DirUrl.PREFAB_DIALOG + "DlgMultiTexture";

    @property(cc.Node)
    item1: cc.Node = null;
    @property(cc.Node)
    item2: cc.Node = null;
    @property(cc.Node)
    item3: cc.Node = null;

    /**
     * @override
     */
    public async onOpen() {
        let arr = [ResUrl.ATLAS.EN, ResUrl.ATLAS.ZH];

        // idx为0的纹理：Cocos自动图集纹理
        let atlas = await Res.load<cc.SpriteAtlas>(arr[0], cc.SpriteAtlas);
        MultiTextureManager.setTexture(0, atlas.getTexture());

        this.createNodes();

        // idx为1的纹理：Cocos自动图集纹理
        atlas = await Res.load<cc.SpriteAtlas>(arr[1], cc.SpriteAtlas);
        MultiTextureManager.setTexture(1, atlas.getTexture());

        this.createNodes();

        // idx为2的纹理：动态合图纹理
        let lastNode = this.node.getChildByName("bg").children[this.node.getChildByName("bg").childrenCount - 1];
        let sf = lastNode.getComponent(MultiSprite).spriteFrame;
        if (sf["_original"]) {
            // 此纹理已进行动态合图
            MultiTextureManager.setTexture(2, sf.getTexture());
        }

        this.createNodes();
    }

    /**
     * 生成3个使用不同图集纹理的节点
     */
    private createNodes() {
        let node1 = Res.instantiate(this.item1);
        this.node.getChildByName("bg").addChild(node1);
        node1.setPosition(0, 0);
        let node2 = Res.instantiate(this.item2);
        this.node.getChildByName("bg").addChild(node2);
        node2.setPosition(0, 0);
        let node3 = Res.instantiate(this.item3);
        this.node.getChildByName("bg").addChild(node3);
        node3.setPosition(0, 0);
    }
}
