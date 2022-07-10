import MultiSprite from "./MultiSprite";

/**
 * Multi-Texture 管理器
 */
export class MultiTextureManager {
    /** 纹理最大数量 */
    public static readonly MAX_TEXTURE_NUM = 8;

    private static _init: boolean = false;
    private static _mat: cc.Material = null;
    private static _texMap: Map<number, cc.Texture2D> = new Map();
    private static _sprites: Set<MultiSprite> = new Set();

    /**
     * 初始化纹理管理器
     */
    public static init(mat: cc.Material): void {
        if (this._init || !(mat instanceof cc.Material) || mat instanceof cc.MaterialVariant) {
            return;
        }
        this._init = true;
        this._mat = mat;
        // 处理引用计数
        this._mat.addRef();
    }

    public static addSprite(sp: MultiSprite): void {
        this._sprites.add(sp);
    }

    public static removeSprite(sp: MultiSprite): void {
        this._sprites.delete(sp);
    }

    /**
     * 设置合批纹理
     * @param idx 纹理id
     * @param tex 纹理对象
     * @returns 
     */
    public static setTexture(idx: number, tex: cc.Texture2D): void {
        if (!this._init) {
            cc.error("[MultiSpriteManager.setTexture] 未初始化MultiSpriteManager");
            return;
        }

        if (!(tex instanceof cc.Texture2D)) {
            cc.error("[MultiSpriteManager.setTexture] 参数类型错误");
            return;
        }

        idx = cc.misc.clampf(idx, 0, MultiTextureManager.MAX_TEXTURE_NUM - 1);
        let oldTex = this._texMap.get(idx);
        if (oldTex === tex) {
            return;
        }

        // 处理引用计数
        if (oldTex) {
            oldTex.decRef();
        }
        tex.addRef();

        this._texMap.set(idx, tex);
        this._mat.setProperty(`texture${idx}`, tex);

        this._sprites.forEach((v) => {
            /**
             * @bug
             * 2.4.6材质hash计算在utils.js中serializeUniforms有bug, 里面for-in遍历材质属性顺序受k-v对插入顺序影响(即setProperty顺序), 即使属性完全一致, hash却不一定一致
             * 因此在此直接创建新的材质
             * ** 此bug在2.4.9中已修复 **
             */
            // v.setMaterial(0, this._mat);

            // 材质变体中的属性必须完全一致, 材质的hash值计算才会一致
            let material = v.getMaterial(0);
            for (let i = 0; i < MultiTextureManager.MAX_TEXTURE_NUM; i++) {
                let texture = this._texMap.get(i);
                if (!texture) {
                    continue;
                }
                let textureImpl = texture.getImpl();
                if (material.getProperty(`texture${i}`, 0) !== textureImpl) {
                    material.setProperty(`texture${i}`, texture);
                }
            }
            /**
             * @bug
             * 调用setProperty后在getHash中不会重新计算hash值, 需要手动设置_dirty
             */
            material["_effect"]._dirty = true;
            
            // 更新textureIdx与材质属性
            v._updateMaterial();
        });
    }

    public static getTexture(idx: number): cc.Texture2D {
        idx = cc.misc.clampf(idx, 0, MultiTextureManager.MAX_TEXTURE_NUM - 1);
        return this._texMap.get(idx);
    }

    public static getIdx(tex: cc.Texture2D): number {
        for (let i = 0; i < MultiTextureManager.MAX_TEXTURE_NUM; i++) {
            if (this._texMap.get(i) === tex) {
                return i;
            }
        }
        return -1;
    }
}
