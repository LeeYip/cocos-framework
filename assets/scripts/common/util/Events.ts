import { EventName } from "../const/EventName";

/**
 * 类装饰器。用于覆盖onLoad和onDestroy方法，在onLoad中注册preloadEvent绑定的所有事件，在onDestroy注销绑定的所有事件
 */
export function eventsOnLoad(constructor: any) {
    let onFunc = constructor.prototype.onLoad;
    let offFunc = constructor.prototype.onDestroy;
    constructor.prototype.onLoad = function () {
        Events.targetOn(this);
        onFunc && onFunc.call(this);
    }
    constructor.prototype.onDestroy = function () {
        Events.targetOff(this);
        offFunc && offFunc.call(this);
    }
}

/**
 * 类装饰器。用于覆盖onEnable和onDisable方法，在onEnable中注册preloadEvent绑定的所有事件，在onDisable注销绑定的所有事件
 */
export function eventsOnEnable(constructor: any) {
    let onFunc = constructor.prototype.onEnable;
    let offFunc = constructor.prototype.onDisable;
    constructor.prototype.onEnable = function () {
        Events.targetOn(this);
        onFunc && onFunc.call(this);
    }
    constructor.prototype.onDisable = function () {
        Events.targetOff(this);
        offFunc && offFunc.call(this);
    }
}

/**
 * 非静态成员函数装饰器。用于预先载入待注册的事件，配合targetOn使用
 * @param event 事件名
 * @param once 事件是否只会触发一次，默认false
 */
export function preloadEvent(event: EventName, once: boolean = false) {
    return function (target: any, funcName: string, desc: PropertyDescriptor) {
        let arr = Events.classMap.get(target.constructor);
        if (arr === undefined) {
            arr = [];
            Events.classMap.set(target.constructor, arr);
        } else {
            let find = arr.find((e) => {
                return e.event === event && e.funcName === funcName;
            });
            if (find) {
                cc.error(`event: ${EventName[event]} 重复载入`);
                return;
            }
        }

        arr.push({
            event: event,
            funcName: funcName,
            once: once
        });
    };
}

/**
 * 装饰器预加载数据
 */
interface PreloadData {
    /** 事件名 */
    event: EventName;
    /** 事件回调函数名 */
    funcName: string;
    /** 事件是否只会触发一次 */
    once: boolean;
}

/**
 * 监听器
 */
interface Listener {
    /** 回调 */
    cb: (...args: any[]) => void;
    /** 是否只触发一次 */
    once: boolean;
}

/**
 * 事件收发管理类
 */
export default class Events {
    /**
     * 预加载数据，存储构造函数、监听事件、监听函数名，用于实例化时注册事件
     */
    public static classMap: Map<Function, PreloadData[]> = new Map();

    /**
     * 存储监听事件、监听函数与监听对象
     */
    private static _eventsMap: Map<EventName, Map<Object, Listener[]>> = new Map();

    /**
     * 注册与target构造函数预先绑定的所有事件
     * @param target 注册目标
     * @param onSuper 是否注册父类成员函数上绑定的事件，默认true
     */
    public static targetOn(target: Object, onSuper: boolean = true) {
        if (onSuper) {
            this.classMap.forEach((value: PreloadData[], key: Function) => {
                if (target instanceof key) {
                    for (let i = 0; i < value.length; i++) {
                        let e = value[i];
                        this.on(e.event, target[e.funcName], target, e.once);
                    }
                }
            });
        } else {
            let arr = this.classMap.get(target.constructor);
            if (arr) {
                for (let i = 0; i < arr.length; i++) {
                    let e = arr[i];
                    this.on(e.event, target[e.funcName], target, e.once);
                }
            }
        }
    }

    /**
     * 注册事件
     * @param event 事件名
     * @param cb 处理事件的监听函数
     * @param target 注册目标
     * @param once 事件是否只会触发一次，默认false
     */
    public static on(event: EventName, cb: (...args: any[]) => void, target: Object, once: boolean = false) {
        if (!cb || !target) {
            cc.error(`event: ${EventName[event]} listener或target不能为空`);
            return;
        }

        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        let list: Listener[] = [];
        if (map === undefined) {
            map = new Map();
            map.set(target, list);
            this._eventsMap.set(event, map);
        } else {
            list = map.get(target);
            if (list === undefined) {
                list = [];
                map.set(target, list);
            } else {
                let result = list.find((e) => { return e.cb === cb; });
                if (result) {
                    cc.error(`event: ${EventName[event]} 重复注册`);
                    return;
                }
            }
        }

        let listener: Listener = {
            cb: cb,
            once: once
        };
        list.push(listener);
    }

    /**
     * 注册事件，触发一次后自动注销
     * @param event 事件名
     * @param cb 处理事件的监听函数
     * @param target 注册目标
     */
    public static once(event: EventName, cb: (...args: any[]) => void, target: Object) {
        this.on(event, cb, target, true);
    }

    /**
     * 移除事件
     * @param event 事件名
     * @param cb 处理事件的监听函数
     * @param target 注册目标
     */
    public static off(event: EventName, cb: (...args: any[]) => void, target: Object) {
        if (!cb || !target) {
            cc.error(`event: ${EventName[event]} listener或target不能为空`);
            return;
        }

        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        if (map === undefined) {
            cc.error(`event: ${EventName[event]} 未注册该事件`);
            return;
        }

        let list: Listener[] = map.get(target);
        if (list === undefined) {
            cc.error(`event: ${EventName[event]} target上未注册该事件`);
            return;
        }

        let index = list.findIndex((e) => { return e.cb === cb; });
        if (index < 0) {
            cc.error(`event: ${EventName[event]} target上未以该listener注册该事件`);
            return;
        }

        list.splice(index, 1);
        if (list.length <= 0) {
            map.delete(target);
            map.size <= 0 && this._eventsMap.delete(event);
        }
    }

    /**
     * 移除target上注册的所有事件
     * @param target 注册目标
     */
    public static targetOff(target: Object) {
        if (!target) {
            cc.error(`event: ${target} target不能为空`);
            return;
        }

        this._eventsMap.forEach((map, event) => {
            map.delete(target);
            map.size <= 0 && this._eventsMap.delete(event);
        });
    }

    /**
     * 派发事件
     * @param event 事件名
     * @param args 事件参数
     */
    public static emit(event: EventName, ...args: any[]) {
        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        if (map === undefined) {
            cc.warn(`event: ${EventName[event]} 未注册该事件`);
            return;
        }

        let i: number;
        let callArr: Array<{ cb: (...args: any[]) => void; target: Object }> = [];
        let onceArr: Array<{ cb: (...args: any[]) => void; target: Object }> = [];
        map.forEach((list, target) => {
            for (i = 0; i < list.length; i++) {
                let listener = list[i];
                callArr.push({ cb: listener.cb, target: target });
                if (listener.once) {
                    onceArr.push({ cb: listener.cb, target: target });
                }
            }
        });
        // 移除所有once的监听
        for (i = 0; i < onceArr.length; i++) {
            let e = onceArr[i];
            this.off(event, e.cb, e.target);
        }
        // 延迟到此处调用事件回调，防止受到回调过程中的 注册/注销 影响
        for (i = 0; i < callArr.length; i++) {
            let e = callArr[i];
            e.cb.call(e.target, ...args);
        }
    }

    /**
     * 派发事件--异步
     * @param event 事件名
     * @param args 事件参数
     */
    public static async emitAsync(event: EventName, ...args: any[]) {
        let map: Map<Object, Listener[]> = this._eventsMap.get(event);
        if (map === undefined) {
            cc.warn(`event: ${EventName[event]} 未注册该事件`);
            return;
        }

        let i: number;
        let callArr: Array<{ cb: (...args: any[]) => void; target: Object }> = [];
        let onceArr: Array<{ cb: (...args: any[]) => void; target: Object }> = [];
        map.forEach((list, target) => {
            for (i = 0; i < list.length; i++) {
                let listener = list[i];
                callArr.push({ cb: listener.cb, target: target });
                if (listener.once) {
                    onceArr.push({ cb: listener.cb, target: target });
                }
            }
        });
        // 移除所有once的监听
        for (i = 0; i < onceArr.length; i++) {
            let e = onceArr[i];
            this.off(event, e.cb, e.target);
        }
        // 延迟到此处调用事件回调，防止受到回调过程中的 注册/注销 影响
        let arr: Promise<any>[] = [];
        for (i = 0; i < callArr.length; i++) {
            let e = callArr[i];
            arr.push(e.cb.call(e.target, ...args));
        }
        await Promise.all(arr);
    }
}
