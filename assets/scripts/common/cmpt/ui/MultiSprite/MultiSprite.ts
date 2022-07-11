import EditorTool from "../../../util/EditorTool";
import MultiAssemblerBarFilled from "./assembler/MultiAssemblerBarFilled";
import MultiAssemblerRadialFilled from "./assembler/MultiAssemblerRadialFilled";
import MultiAssemblerSimple from "./assembler/MultiAssemblerSimple";
import MultiAssemblerSliced from "./assembler/MultiAssemblerSliced";
import MultiAssemblerTiled from "./assembler/MultiAssemblerTiled";
import { MultiTextureManager } from "./MultiTextureManager";

const { ccclass, property, requireComponent, menu, inspector } = cc._decorator;

/**
 * Multi-Texture 渲染组件，兼容web与native，支持simple、sliced、tiled、filled
 */
@ccclass
@menu("Framework/UI组件/MultiSprite")
@inspector("packages://inspector/inspectors/comps/sprite.js")
export default class MultiSprite extends cc.Sprite {

    private _textureIdx: number = 0;
    /** 当前渲染组件使用的纹理下标，不需要主动调用，该组件内部会自行处理 */
    private get textureIdx(): number { return this._textureIdx; }
    private set textureIdx(v: number) {
        this._textureIdx = cc.misc.clampf(v, 0, MultiTextureManager.MAX_TEXTURE_NUM - 1);
        this["setVertsDirty"]();
    }

    protected resetInEditor(): void {
        EditorTool.load<cc.Material>("res/shader/materials/multiTexture.mtl").then((mat) => {
            if (mat) {
                this.setMaterial(0, mat);
            }
        });
    }

    protected onLoad(): void {
        super.onLoad?.();
        MultiTextureManager.addSprite(this);
    }

    protected onDestroy(): void {
        super.onDestroy?.();
        MultiTextureManager.removeSprite(this);
    }

    /**
     * 设置spriteFrame和material时引擎内部会调用，更新textureIdx，更新材质属性
     * @override
     */
    public _updateMaterial(): void {
        // make sure material is belong to self.
        let material = this.getMaterial(0);
        if (material) {
            let texture = null;
            let textureImpl = null;
            if (this.spriteFrame) {
                texture = this.spriteFrame.getTexture();
                textureImpl = texture && texture.getImpl();
            }
            if (material.name.indexOf("multiTexture") >= 0) {
                // 初始化纹理管理器
                MultiTextureManager.init(material["_material"]);
                // 更新textureIdx
                let idx = MultiTextureManager.getIdx(texture);
                if (idx >= 0) {
                    this.textureIdx = idx;
                }
                if (material.getProperty(`texture${this.textureIdx}`, 0) !== textureImpl) {
                    material.setProperty(`texture${this.textureIdx}`, texture);
                }
            } else {
                if (material.getProperty(`texture`, 0) !== textureImpl) {
                    material.setProperty(`texture`, texture);
                }
            }
        }

        cc.BlendFunc.prototype["_updateMaterial"].call(this);
    }
}

cc.Assembler.register(MultiSprite, {
    getConstructor(sprite) {
        let ctor: any = MultiAssemblerSimple;
        switch (sprite.type) {
            case cc.Sprite.Type.SLICED:
                ctor = MultiAssemblerSliced;
                break;
            case cc.Sprite.Type.TILED:
                ctor = MultiAssemblerTiled;
                break;
            case cc.Sprite.Type.FILLED:
                if (sprite._fillType === cc.Sprite.FillType.RADIAL) {
                    ctor = MultiAssemblerRadialFilled;
                } else {
                    ctor = MultiAssemblerBarFilled;
                }
                break;
        }
        return ctor;
    }
});
