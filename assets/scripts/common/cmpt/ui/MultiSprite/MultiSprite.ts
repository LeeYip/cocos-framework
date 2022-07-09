import EditorTool from "../../../util/EditorTool";
import MultiAssembleBarFilled from "./assemble/MultiAssembleBarFilled";
import MultiAssembleRadialFilled from "./assemble/MultiAssembleRadialFilled";
import MultiAssembleSimple from "./assemble/MultiAssembleSimple";
import MultiAssembleSliced from "./assemble/MultiAssembleSliced";
import MultiAssembleTiled from "./assemble/MultiAssembleTiled";
import MultiTextureIdx from "./MultiTextureIdx";
import { MultiTextureManager } from "./MultiTextureManager";

const { ccclass, property, requireComponent, menu, inspector } = cc._decorator;

/**
 * Multi-Texture 渲染组件，兼容web与native，支持simple、sliced、tiled、filled
 */
@ccclass
@requireComponent(MultiTextureIdx)
@menu("Framework/UI组件/MultiSprite")
@inspector("packages://inspector/inspectors/comps/sprite.js")
export default class MultiSprite extends cc.Sprite {

    private _multiTextureIdx: MultiTextureIdx = null;
    private get multiTextureIdx(): MultiTextureIdx {
        if (!this._multiTextureIdx) {
            this._multiTextureIdx = this.getComponent(MultiTextureIdx);
        }
        return this._multiTextureIdx;
    }

    /** 当前渲染组件使用的纹理ID */
    public get textureIdx(): number { return this.multiTextureIdx.textureIdx; }
    public set textureIdx(v: number) {
        this.multiTextureIdx.textureIdx = v;
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

    protected _updateMaterial() {
        let texture = null;
        if (this.spriteFrame) {
            texture = this.spriteFrame.getTexture();
            // 更新textureIdx
            this.updateTextuerIdx();
        }

        // make sure material is belong to self.
        let material = this.getMaterial(0);
        if (material) {
            let textureImpl = texture && texture.getImpl();
            if (material.name.indexOf("multiTexture") >= 0) {
                MultiTextureManager.init(material["_material"]);
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

    /**
     * 根据MultiTextureManager缓存的纹理更新textureIdx
     */
    public updateTextuerIdx() {
        if (this.spriteFrame) {
            let texture = this.spriteFrame.getTexture();
            let idx = MultiTextureManager.getIdx(texture);
            if (idx >= 0) {
                this.textureIdx = idx;
            }
        }
    }
}

cc.Assembler.register(MultiSprite, {
    getConstructor(sprite) {
        let ctor: any = MultiAssembleSimple;
        switch (sprite.type) {
            case cc.Sprite.Type.SLICED:
                ctor = MultiAssembleSliced;
                break;
            case cc.Sprite.Type.TILED:
                ctor = MultiAssembleTiled;
                break;
            case cc.Sprite.Type.FILLED:
                if (sprite._fillType === cc.Sprite.FillType.RADIAL) {
                    ctor = MultiAssembleRadialFilled;
                } else {
                    ctor = MultiAssembleBarFilled;
                }
                break;
        }
        return ctor;
    }
});
