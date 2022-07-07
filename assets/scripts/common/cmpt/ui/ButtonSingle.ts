const { ccclass, property, menu, requireComponent } = cc._decorator;

/**
 * 按钮组数据
 */
interface GroupData {
    /** 该组是否锁定，同组按钮被触摸时进入锁定状态 */
    lock: boolean;
    /** 同组按钮 */
    buttonSet: Set<cc.Button>;
}

/**
 * 按钮分组
 */
enum ButtonGroup {
    DEFAULT,
    GROUP1,
    GROUP2,
}

/**
 * 防多点触摸的按钮，同组按钮同一时刻只会有一个生效
 */
@ccclass
@requireComponent(cc.Button)
@menu('Framework/UI组件/ButtonSingle')
export default class ButtonSingle extends cc.Component {
    @property({ type: cc.Enum(ButtonGroup), tooltip: CC_DEV && '按钮分组，同组按钮同一时刻只会有一个生效' })
    public buttonGroup: ButtonGroup = ButtonGroup.DEFAULT;

    /** 记录所有绑定该组件的按钮数据 */
    private static _groupMap: Map<ButtonGroup, GroupData> = null;
    private static get groupMap(): Map<ButtonGroup, GroupData> {
        if (this._groupMap === null) {
            this._groupMap = new Map();
        }
        return this._groupMap;
    }

    private _button: cc.Button = null;

    protected onLoad(): void {
        this._button = this.getComponent(cc.Button);
        let groupData: GroupData = ButtonSingle.groupMap.get(this.buttonGroup);
        if (groupData === undefined) {
            groupData = {
                lock: false,
                buttonSet: new Set()
            };
            ButtonSingle.groupMap.set(this.buttonGroup, groupData);
        }
        groupData.buttonSet.add(this._button);

        // 监听触摸事件
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    protected onDestroy(): void {
        let groupData: GroupData = ButtonSingle.groupMap.get(this.buttonGroup);
        if (groupData === undefined) {
            cc.error(`[ButtonSingle.onDestroy] 数据异常 ButtonGroup: ${this.buttonGroup}`);
            return;
        }
        groupData.buttonSet.delete(this._button);
        this.unlock(groupData);
    }

    private onTouchStart(event: cc.Event.EventTouch): void {
        let groupData: GroupData = ButtonSingle.groupMap.get(this.buttonGroup);
        if (groupData === undefined) {
            cc.error(`[ButtonSingle.onTouchStart] 数据异常 ButtonGroup: ${this.buttonGroup}`);
            return;
        }

        if (groupData.lock) {
            return;
        }
        groupData.lock = true;
        groupData.buttonSet.forEach((e) => {
            e.enabled = (e === this._button);
        });
    }

    private onTouchEnd(event: cc.Event.EventTouch): void {
        let groupData: GroupData = ButtonSingle.groupMap.get(this.buttonGroup);
        if (groupData === undefined) {
            cc.error(`[ButtonSingle.onTouchEnd] 数据异常 ButtonGroup: ${this.buttonGroup}`);
            return;
        }

        this.unlock(groupData);
    }

    /**
     * 当前按钮松开或销毁时解除同组按钮锁定状态
     */
    private unlock(groupData: GroupData): void {
        if (groupData.lock && this._button.enabled) {
            groupData.lock = false;
            groupData.buttonSet.forEach((e) => {
                e.enabled = true;
            });
        }
    }
}
