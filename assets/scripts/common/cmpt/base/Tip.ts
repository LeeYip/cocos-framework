const { ccclass, property, disallowMultiple, menu } = cc._decorator;

@ccclass
@disallowMultiple
@menu('Framework/基础组件/Tip')
export default class Tip extends cc.Component {

    @property(cc.Layout) public Layout: cc.Layout = null;
    @property(cc.Label) public TextLab: cc.Label = null;

    public init(text: string): void {
        this.TextLab.string = text;
        this.TextLab['_forceUpdateRenderData']();
        this.Layout.updateLayout();
    }
}
