import Res from "../../../util/Res";

const { ccclass, menu, disallowMultiple, requireComponent } = cc._decorator;

/**
 * spine组件，自动管理资源的引用计数
 */
@ccclass
@disallowMultiple
@requireComponent(sp.Skeleton)
@menu("Framework/UI组件/ResSpine")
export default class ResSpine extends cc.Component {
    // 动态加载的资源
    private _asset: sp.SkeletonData = null;

    private _url: string = "";

    private _spine: sp.Skeleton = null;
    private get spine(): sp.Skeleton {
        if (!this._spine) {
            this._spine = this.getComponent(sp.Skeleton);
        }
        return this._spine;
    }

    public get skeletonData(): sp.SkeletonData {
        return this.spine.skeletonData;
    }
    public set skeletonData(v: sp.SkeletonData) {
        if (!this.isValid || this.spine.skeletonData === v) {
            return;
        }
        v?.addRef();
        this._asset?.decRef();
        this._asset = v;
        this.spine.skeletonData = v;
    }

    protected onDestroy(): void {
        this._asset?.decRef();
    }

    /**
     * 设置skeletonData
     * @param url 骨骼资源路径，规则同Res加载路径
     */
    public async setSkeletonData(url: string): Promise<void> {
        this._url = url;
        let result = Res.get(url, sp.SkeletonData) || await Res.load(url, sp.SkeletonData);
        // 如短时间内多次调用，需保证显示最新一次加载的资源
        if (result instanceof sp.SkeletonData && this._url === url) {
            this.skeletonData = result;
        }
    }
}
