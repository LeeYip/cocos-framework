import { ResUrl } from "../../const/Url";
import RecyclePool from "../../util/RecyclePool";
import Res from "../../util/Res";
import Tool from "../../util/Tool";
import DialogBase from "./DialogBase";
import Tip from "./Tip";

const { ccclass, property, disallowMultiple, menu } = cc._decorator;

/**
 * tip数据
 */
export interface TipData {
    /** 文字内容 */
    text: string;
    /** 此条文字是否唯一显示 */
    unique?: boolean;
    /** 存在时间 单位s */
    duration?: number;
    /** 消失时的渐隐时间 单位s */
    fade?: number;
    /** 初始位置 */
    start?: cc.Vec2;
    /** 渐隐过程终点位置 */
    end?: cc.Vec2;
}

/**
 * 全局弹窗管理器
 */
@ccclass
@disallowMultiple
@menu("Framework/基础组件/Layer")
export default class Layer extends cc.Component {
    public static inst: Layer = null;

    @property(cc.Node) private mainLayer: cc.Node = null;
    @property(cc.Node) private dialogLayer: cc.Node = null;
    @property(cc.Node) private loadingLayer: cc.Node = null;
    @property(cc.Node) private tipLayer: cc.Node = null;

    /** 打开Loading层计数，为0时关闭，防止某些情况同时触发打开关闭Loading */
    private _loadingCount: number = 0;
    /** tip节点池，缓存的tip节点留在tipLayer中不移除，只改变active隐藏 */
    private _tipPool: cc.Node[] = [];
    /** 当前存在的tip文字数组 */
    private _tipTexts: string[] = [];

    protected resetInEditor(): void {
        if (!CC_EDITOR) {
            return;
        }
        let checkNode = (...names: string[]) => {
            names.forEach((name) => {
                if (!this.node.getChildByName(name)) {
                    let node = new cc.Node(name);
                    this.node.addChild(node);
                    let widget = node.addComponent(cc.Widget);
                    widget.top = 0;
                    widget.isAlignTop = true;
                    widget.bottom = 0;
                    widget.isAlignBottom = true;
                    widget.left = 0;
                    widget.isAlignLeft = true;
                    widget.right = 0;
                    widget.isAlignRight = true;
                    if (name === "LoadingLayer") {
                        node.addComponent(cc.BlockInputEvents);
                    }
                }
            });
        };
        checkNode("MainLayer", "DialogLayer", "LoadingLayer", "TipLayer");
        this.mainLayer = this.node.getChildByName("MainLayer");
        this.dialogLayer = this.node.getChildByName("DialogLayer");
        this.loadingLayer = this.node.getChildByName("LoadingLayer");
        this.tipLayer = this.node.getChildByName("TipLayer");
    }

    protected onLoad(): void {
        Layer.inst = this;
        this.hideLoading();
    }

    protected onDestroy(): void {
        Layer.inst = null;
    }

    /**
     * 获取文件名（截取url最后一个斜杠后的内容）
     */
    public getNameByUrl(url: string): string {
        return url.substring(url.lastIndexOf("/") + 1, url.length);
    }

    /**
     * 进入常驻界面，并清空dialog与tip（不同于dialog，常驻界面始终显示在最底层，且同时只会存在一个）
     */
    public async enterMain(url: string): Promise<cc.Node | null> {
        this.showLoading();
        let prefab: cc.Prefab = Res.get(url, cc.Prefab) || await Res.load(url, cc.Prefab);
        this.hideLoading();
        if (!prefab) {
            cc.error(`[Layer.enterMain] can not find prefab: ${url}`);
            return null;
        }

        this.mainLayer.destroyAllChildren();
        this.closeDialogs();
        this.clearTips();
        let node: cc.Node = Res.instantiate(prefab);
        node.setPosition(0, 0);
        this.mainLayer.addChild(node);
        return node;
    }

    /**
     * 获取弹窗组件（返回遍历到的第一个）
     * @param url prefab路径，规则同Res加载路径
     */
    public getDialog(url: string): DialogBase {
        for (let i = 0; i < this.dialogLayer.childrenCount; i++) {
            let node = this.dialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (cmpt.prefabUrl === url) {
                return cmpt;
            }
        }
        return null;
    }

    /**
     * （同步方法，需确保事先已加载预制资源）打开弹窗
     * @param url prefab路径，规则同Res加载路径
     * @param args DialogBase.open调用参数
     */
    public openDialog(url: string, ...args: any[]): void {
        let node: cc.Node = RecyclePool.get(url);
        if (!node) {
            let prefab: cc.Prefab = Res.get(url, cc.Prefab);
            if (!prefab) {
                cc.error(`[Layer.openDialog] can not find dialog prefab: ${url}`);
                return;
            }
    
            node = Res.instantiate(prefab);
        }

        this.dialogLayer.addChild(node);
        node.setPosition(0, 0);
        let cmpt = node.getComponent(DialogBase);
        if (cmpt) {
            //@ts-ignore
            cmpt._prefabUrl = url;
            cmpt.playOpen();
            cmpt.onOpen(...args);
        }
    }

    /**
     * （同步方法，需确保事先已加载预制资源）打开唯一弹窗--同一弹窗节点只能同时存在一个
     * @param url prefab路径，规则同Res加载路径
     * @param args DialogBase.open调用参数
     */
    public openUniDialog(url: string, ...args: any[]): void {
        if (this.getDialog(url)) {
            return;
        }

        this.openDialog(url, ...args);
    }

    /**
     * 打开弹窗
     * @async
     * @param url prefab路径，规则同Res加载路径
     * @param args DialogBase.open调用参数
     */
    public async openDialogAsync(url: string, ...args: any[]): Promise<void> {
        let node: cc.Node = RecyclePool.get(url);
        if (!node) {
            this.showLoading();
            let prefab: cc.Prefab = await Res.load(url, cc.Prefab);
            this.hideLoading();
            if (!prefab) {
                cc.error(`[Layer.openDialogAsync] can not find dialog prefab: ${url}`);
                return;
            }
            node = Res.instantiate(prefab);
        }

        this.dialogLayer.addChild(node);
        node.setPosition(0, 0);
        let cmpt = node.getComponent(DialogBase);
        if (cmpt) {
            //@ts-ignore
            cmpt._prefabUrl = url;
            cmpt.playOpen();
            cmpt.onOpen(...args);
        }
    }

    /**
     * 打开唯一弹窗--同一弹窗节点只能同时存在一个
     * @async
     * @param url prefab路径，规则同Res加载路径
     * @param args DialogBase.open调用参数
     */
    public async openUniDialogAsync(url: string, ...args: any[]): Promise<void> {
        if (this.getDialog(url)) {
            return;
        }

        await this.openDialogAsync(url, ...args);
    }

    /**
     * 关闭遍历到的第一个弹窗
     * @param url prefab路径，规则同Res加载路径
     * @param play true：调用playClose播放弹窗关闭动画；false：直接调用close关闭弹窗
     */
    public closeDialog(url: string, play: boolean = false): void {
        let cmpt = this.getDialog(url);
        if (!cmpt) {
            return;
        }
        play ? cmpt.playClose() : cmpt.close();
    }

    /**
     * 关闭所有同路径弹窗，不传参则关闭所有弹窗
     * @param url prefab路径，规则同Res加载路径
     * @param play true：调用playClose播放弹窗关闭动画；false：直接调用close关闭弹窗
     */
    public closeDialogs(url: string = "", play: boolean = false): void {
        for (let i = this.dialogLayer.childrenCount - 1; i >= 0; i--) {
            let node = this.dialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (!url || cmpt.prefabUrl === url) {
                play ? cmpt.playClose() : cmpt.close();
            }
        }
    }

    /**
     * 异步等待弹窗关闭（只等待遍历到的第一个）
     * @param url prefab路径，规则同Res加载路径
     */
    public async waitCloseDialog(url: string): Promise<void> {
        let cmpt = this.getDialog(url);
        if (!cmpt) {
            return;
        }
        return await new Promise((resolve, reject) => {
            cmpt.addResolve(resolve);
        });
    }

    /**
     * 异步等待所有同路径弹窗关闭
     * @param url prefab路径，规则同Res加载路径
     */
    public async waitCloseDialogs(url: string): Promise<void[]> {
        let arr: Array<Promise<void>> = [];
        for (let i = 0; i < this.dialogLayer.childrenCount; i++) {
            let node = this.dialogLayer.children[i];
            let cmpt = node.getComponent(DialogBase);
            if (!cmpt) {
                continue;
            }
            if (cmpt.prefabUrl === url) {
                arr.push(new Promise((resolve, reject) => {
                    cmpt.addResolve(resolve);
                }));
            }
        }
        return await Promise.all(arr);
    }

    /**
     * 弹出一条文字提示
     * @param data TipData | string 提示数据
     */
    public async showTip(data: TipData | string): Promise<void> {
        // 处理tipData默认值
        let tipData: TipData = null;
        if (typeof data === "string") {
            tipData = {
                text: data
            };
        } else {
            tipData = data;
        }
        if (!tipData.hasOwnProperty("unique")) {
            tipData.unique = false;
        }
        if (!tipData.hasOwnProperty("duration")) {
            tipData.duration = 1;
        }
        if (!tipData.hasOwnProperty("fade")) {
            tipData.fade = 0.5;
        }
        if (!tipData.hasOwnProperty("start")) {
            tipData.start = cc.v2(0, 0);
        }
        if (!tipData.hasOwnProperty("end")) {
            tipData.end = cc.v2(0, 0);
        }

        // 唯一显示
        if (tipData.unique && Tool.arrayHas(this._tipTexts, tipData.text)) {
            return;
        }
        this._tipTexts.push(tipData.text);

        // 获取节点
        let tipNode: cc.Node = null;
        if (this._tipPool.length > 0) {
            tipNode = this._tipPool.shift();
        } else {
            let prefab: cc.Prefab = await Res.load(ResUrl.PREFAB.TIP, cc.Prefab);
            if (!prefab) {
                cc.error(`[Layer.showTip] can not load prefab: ${ResUrl.PREFAB.TIP}`);
                return;
            }
            tipNode = Res.instantiate(prefab);
            this.tipLayer.addChild(tipNode);
        }

        // 动画
        let delay = cc.delayTime(tipData.duration);
        let fade = cc.fadeOut(tipData.fade);
        let moveTo = cc.moveTo(tipData.fade, tipData.end);
        let call = cc.callFunc(() => {
            tipNode.active = false;
            this._tipPool.push(tipNode);
            Tool.arrayDelete(this._tipTexts, tipData.text);
        });
        tipNode.active = true;
        tipNode.opacity = 255;
        tipNode.setPosition(tipData.start);
        tipNode.setSiblingIndex(this.tipLayer.childrenCount - 1);
        tipNode.runAction(cc.sequence(delay, cc.spawn(fade, moveTo), call));

        // 数据
        tipNode.getComponent(Tip)?.init(tipData.text);
    }

    /**
     * 清空所有提示
     */
    public clearTips(): void {
        this._tipPool.length = 0;
        this._tipTexts.length = 0;
        this.tipLayer.destroyAllChildren();
    }

    /**
     * 打开全局loading遮罩（打开与关闭的调用必须一一对应）
     */
    public showLoading(): void {
        this._loadingCount++;
        if (!this.loadingLayer.active) {
            this.loadingLayer.active = true;
            // 默认0.5s后才显示loading内容
            let content = this.loadingLayer.getChildByName("content");
            if (content) {
                content.active = false;
                this.unscheduleAllCallbacks();
                Tool.waitCmpt(this, 0.5).then(() => {
                    content.active = true;
                });
            }
        }
    }

    /**
     * 关闭全局loading遮罩
     */
    public hideLoading(): void {
        this._loadingCount--;
        if (this._loadingCount <= 0) {
            this._loadingCount = 0;
            this.loadingLayer.active = false;
            this.unscheduleAllCallbacks();
        }
    }
}
