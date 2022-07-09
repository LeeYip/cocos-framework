import MultiAssemble from "./MultiAssemble";

export default class MultiAssembleSliced extends MultiAssemble {
    public initData() {
        this.verticesCount = 16;
        this.indicesCount = 54;

        if (this._renderData.meshCount > 0) return;
        let data = this._renderData;
        // createFlexData支持创建指定格式的renderData
        data.createFlexData(0, this.verticesCount, this.indicesCount, this.getVfmt());

        let indices = this._renderData.iDatas[0];
        let indexOffset = 0;
        for (let r = 0; r < 3; ++r) {
            for (let c = 0; c < 3; ++c) {
                let start = r * 4 + c;
                indices[indexOffset++] = start;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + 4;
                indices[indexOffset++] = start + 1;
                indices[indexOffset++] = start + 5;
                indices[indexOffset++] = start + 4;
            }
        }
    }

    public initLocal() {
        this._local = [];
        this._local.length = 8;
    }

    public updateRenderData(sprite) {
        let frame = sprite._spriteFrame;
        this.packToDynamicAtlas(sprite, frame);

        if (sprite._vertsDirty) {
            this.updateUVs(sprite);
            this.updateVerts(sprite);
            this.updateTextureIdx(sprite);
            sprite._vertsDirty = false;
        }
    }

    public updateVerts(sprite) {
        let node = sprite.node,
            width = node.width, height = node.height,
            appx = node.anchorX * width, appy = node.anchorY * height;

        let frame = sprite.spriteFrame;
        let leftWidth = frame.insetLeft;
        let rightWidth = frame.insetRight;
        let topHeight = frame.insetTop;
        let bottomHeight = frame.insetBottom;

        let sizableWidth = width - leftWidth - rightWidth;
        let sizableHeight = height - topHeight - bottomHeight;
        let xScale = width / (leftWidth + rightWidth);
        let yScale = height / (topHeight + bottomHeight);
        xScale = (isNaN(xScale) || xScale > 1) ? 1 : xScale;
        yScale = (isNaN(yScale) || yScale > 1) ? 1 : yScale;
        sizableWidth = sizableWidth < 0 ? 0 : sizableWidth;
        sizableHeight = sizableHeight < 0 ? 0 : sizableHeight;

        // update local
        let local = this._local;
        local[0] = -appx;
        local[1] = -appy;
        local[2] = leftWidth * xScale - appx;
        local[3] = bottomHeight * yScale - appy;
        local[4] = local[2] + sizableWidth;
        local[5] = local[3] + sizableHeight;
        local[6] = width - appx;
        local[7] = height - appy;

        this.updateWorldVerts(sprite);
    }

    public updateUVs(sprite) {
        let verts = this._renderData.vDatas[0];
        let uvSliced = sprite.spriteFrame.uvSliced;
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        for (let row = 0; row < 4; ++row) {
            for (let col = 0; col < 4; ++col) {
                let vid = row * 4 + col;
                let uv = uvSliced[vid];
                let voffset = vid * floatsPerVert;
                verts[voffset + uvOffset] = uv.u;
                verts[voffset + uvOffset + 1] = uv.v;
            }
        }
    }

    public updateWorldVerts(sprite) {
        let matrix = sprite.node._worldMatrix;
        let matrixm = matrix.m,
            a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
            tx = matrixm[12], ty = matrixm[13];

        let local = this._local;
        let world = this._renderData.vDatas[0];

        let floatsPerVert = this.floatsPerVert;
        for (let row = 0; row < 4; ++row) {
            let localRowY = local[row * 2 + 1];
            for (let col = 0; col < 4; ++col) {
                let localColX = local[col * 2];
                let worldIndex = (row * 4 + col) * floatsPerVert;
                world[worldIndex] = localColX * a + localRowY * c + tx;
                world[worldIndex + 1] = localColX * b + localRowY * d + ty;
            }
        }
    }
}

if (CC_NATIVERENDERER) {
    let proto = MultiAssembleSliced.prototype;
    //@ts-ignore
    let nativeProto = renderer.SlicedSprite2D.prototype;

    proto.updateWorldVerts = function (comp) {
        //@ts-ignore
        this._dirtyPtr[0] |= cc.Assembler.FLAG_VERTICES_DIRTY;
    };

    //@ts-ignore
    proto._extendNative = function () {
        nativeProto.ctor.call(this);
    };

    proto.initLocal = function () {
        this._local = new Float32Array(8);
        nativeProto.setLocalData.call(this, this._local);
    };
}
