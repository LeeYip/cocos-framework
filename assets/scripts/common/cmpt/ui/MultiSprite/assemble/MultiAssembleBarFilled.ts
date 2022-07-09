import MultiAssemble from "./MultiAssemble";

export default class MultiAssembleBarFilled extends MultiAssemble {
    public updateRenderData(sprite) {
        let frame = sprite._spriteFrame;
        this.packToDynamicAtlas(sprite, frame);

        if (!sprite._vertsDirty) {
            return;
        }

        let fillStart = sprite._fillStart;
        let fillRange = sprite._fillRange;

        if (fillRange < 0) {
            fillStart += fillRange;
            fillRange = -fillRange;
        }

        fillRange = fillStart + fillRange;

        fillStart = fillStart > 1.0 ? 1.0 : fillStart;
        fillStart = fillStart < 0.0 ? 0.0 : fillStart;

        fillRange = fillRange > 1.0 ? 1.0 : fillRange;
        fillRange = fillRange < 0.0 ? 0.0 : fillRange;
        fillRange = fillRange - fillStart;
        fillRange = fillRange < 0 ? 0 : fillRange;

        let fillEnd = fillStart + fillRange;
        fillEnd = fillEnd > 1 ? 1 : fillEnd;

        this.updateUVs(sprite, fillStart, fillEnd);
        this.updateVerts(sprite, fillStart, fillEnd);
        this.updateTextureIdx(sprite);

        sprite._vertsDirty = false;
    }

    public updateUVs(sprite, fillStart, fillEnd) {
        let spriteFrame = sprite._spriteFrame;

        //build uvs
        let atlasWidth = spriteFrame._texture.width;
        let atlasHeight = spriteFrame._texture.height;
        let textureRect = spriteFrame._rect;
        //uv computation should take spritesheet into account.
        let ul, vb, ur, vt;
        let quadUV0, quadUV1, quadUV2, quadUV3, quadUV4, quadUV5, quadUV6, quadUV7;
        if (spriteFrame._rotated) {
            ul = (textureRect.x) / atlasWidth;
            vb = (textureRect.y + textureRect.width) / atlasHeight;
            ur = (textureRect.x + textureRect.height) / atlasWidth;
            vt = (textureRect.y) / atlasHeight;

            quadUV0 = quadUV2 = ul;
            quadUV4 = quadUV6 = ur;
            quadUV3 = quadUV7 = vb;
            quadUV1 = quadUV5 = vt;
        }
        else {
            ul = (textureRect.x) / atlasWidth;
            vb = (textureRect.y + textureRect.height) / atlasHeight;
            ur = (textureRect.x + textureRect.width) / atlasWidth;
            vt = (textureRect.y) / atlasHeight;

            quadUV0 = quadUV4 = ul;
            quadUV2 = quadUV6 = ur;
            quadUV1 = quadUV3 = vb;
            quadUV5 = quadUV7 = vt;
        }

        let verts = this._renderData.vDatas[0];
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        switch (sprite._fillType) {
            case cc.Sprite.FillType.HORIZONTAL:
                verts[uvOffset] = quadUV0 + (quadUV2 - quadUV0) * fillStart;
                verts[uvOffset + 1] = quadUV1 + (quadUV3 - quadUV1) * fillStart;
                verts[uvOffset + floatsPerVert] = quadUV0 + (quadUV2 - quadUV0) * fillEnd;
                verts[uvOffset + floatsPerVert + 1] = quadUV1 + (quadUV3 - quadUV1) * fillEnd;
                verts[uvOffset + floatsPerVert * 2] = quadUV4 + (quadUV6 - quadUV4) * fillStart;
                verts[uvOffset + floatsPerVert * 2 + 1] = quadUV5 + (quadUV7 - quadUV5) * fillStart;
                verts[uvOffset + floatsPerVert * 3] = quadUV4 + (quadUV6 - quadUV4) * fillEnd;
                verts[uvOffset + floatsPerVert * 3 + 1] = quadUV5 + (quadUV7 - quadUV5) * fillEnd;
                break;
            case cc.Sprite.FillType.VERTICAL:
                verts[uvOffset] = quadUV0 + (quadUV4 - quadUV0) * fillStart;
                verts[uvOffset + 1] = quadUV1 + (quadUV5 - quadUV1) * fillStart;
                verts[uvOffset + floatsPerVert] = quadUV2 + (quadUV6 - quadUV2) * fillStart;
                verts[uvOffset + floatsPerVert + 1] = quadUV3 + (quadUV7 - quadUV3) * fillStart;
                verts[uvOffset + floatsPerVert * 2] = quadUV0 + (quadUV4 - quadUV0) * fillEnd;
                verts[uvOffset + floatsPerVert * 2 + 1] = quadUV1 + (quadUV5 - quadUV1) * fillEnd;
                verts[uvOffset + floatsPerVert * 3] = quadUV2 + (quadUV6 - quadUV2) * fillEnd;
                verts[uvOffset + floatsPerVert * 3 + 1] = quadUV3 + (quadUV7 - quadUV3) * fillEnd;
                break;
            default:
                cc["errorID"](2626);
                break;
        }
    }

    public updateVerts(sprite, fillStart, fillEnd) {
        let node = sprite.node,
            width = node.width, height = node.height,
            appx = node.anchorX * width, appy = node.anchorY * height;

        let l = -appx, b = -appy,
            r = width - appx, t = height - appy;

        let progressStart, progressEnd;
        switch (sprite._fillType) {
            case cc.Sprite.FillType.HORIZONTAL:
                progressStart = l + (r - l) * fillStart;
                progressEnd = l + (r - l) * fillEnd;

                l = progressStart;
                r = progressEnd;
                break;
            case cc.Sprite.FillType.VERTICAL:
                progressStart = b + (t - b) * fillStart;
                progressEnd = b + (t - b) * fillEnd;

                b = progressStart;
                t = progressEnd;
                break;
            default:
                cc["errorID"](2626);
                break;
        }

        let local = this._local;
        local[0] = l;
        local[1] = b;
        local[2] = r;
        local[3] = t;

        this.updateWorldVerts(sprite);
    }
}
