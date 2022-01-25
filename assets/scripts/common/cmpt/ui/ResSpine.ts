import Res from "../../util/Res";

const { ccclass, menu, disallowMultiple, requireComponent } = cc._decorator;

/**
 * spine组件，自动管理资源的引用计数
 */
@ccclass
@disallowMultiple
@requireComponent(sp.Skeleton)
@menu('Framework/UI组件/ResSpine')
export default class ResSpine extends cc.Component {
    // 动态加载的资源
    private _asset: sp.SkeletonData = null;

    private _spine: sp.Skeleton = null;
    private get spine() {
        if (!this._spine) {
            this._spine = this.getComponent(sp.Skeleton);
        }
        return this._spine;
    }

    protected onDestroy(): void {
        this._asset?.decRef();
    }

    /**
     * 设置skeletonData
     * @param url 
     */
    public async setSkeletonData(url: string) {
        let result = await Res.load(url, sp.SkeletonData);
        if (result instanceof sp.SkeletonData) {
            this._asset?.decRef();
            this._asset = result;
            this._asset.addRef();
            this.spine.skeletonData = result;
        }
    }
}
