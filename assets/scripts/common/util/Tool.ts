import { Group, Tween, TWEEN } from "./Tween";

enum TimeUnit {
    S,
    M,
    H,
    D
}

/**
 * 工具类
 */
export default class Tool {
    /**
     * 深拷贝
     * @param source 源数据
     */
    public static deepCopy<T>(source: T): T {
        if (typeof source !== "object" || source === null || source instanceof RegExp) {
            return source;
        }

        let result: any = null;
        if (Array.isArray(source)) {
            result = [];
            for (let item of source) {
                result.push(this.deepCopy(item));
            }
        } else {
            result = {};
            for (let key in source) {
                result[key] = this.deepCopy(source[key]);
            }
        }

        return result;
    }

    /**
     * 异步等待 - setTimeout
     * @param seconds 
     */
    public static wait(seconds: number): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, seconds * 1000);
        });
    }

    /**
     * 异步等待 - cc.Component.scheduleOnce
     */
    public static waitCmpt(cmpt: cc.Component, seconds: number): Promise<void> {
        return new Promise((resolve, reject) => {
            cmpt.scheduleOnce(() => {
                resolve();
            }, seconds);
        });
    }

    /**
     * 异步等待 - tween 默认group为TWEEN
     */
    public static waitTween(cmpt: cc.Component, seconds: number, group: Group = TWEEN): Promise<void> {
        return new Promise((resolve, reject) => {
            new Tween({ k: 0 }, group)
                .to({ k: 1 }, seconds * 1000)
                .onComplete(() => {
                    resolve();
                })
                .start()
                .bindCCObject(cmpt);
        });
    }

    /**
     * 线性插值
     * @param a 起始值
     * @param b 目标值
     * @param r ratio between 0 and 1
     * @param min 最小间隔值
     */
    public static lerp(a: number, b: number, r: number, min: number = 0): number {
        min = Math.abs(min);
        let c = b - a;
        let delta = c * r;
        delta = delta < 0 ? Math.min(delta, -min) : Math.max(delta, min);
        if (Math.abs(delta) > Math.abs(c)) {
            delta = c;
        }
        return a + delta;
    }

    /**
     * 通过两点坐标(不平行于坐标轴)和x，计算两点式方程结果y
     */
    public static calcTwoPointForm(p1: cc.Vec2, p2: cc.Vec2, x: number): number {
        if (p1.x === p2.x) return p1.y;
        return (p2.y - p1.y) * (x - p1.x) / (p2.x - p1.x) + p1.y;
    }

    /**
     * 返回两个矩形的重叠矩形，不重叠则返回null
     */
    public static overlapRect(r1: cc.Rect, r2: cc.Rect): cc.Rect {
        let xMin = Math.max(r1.xMin, r2.xMin);
        let xMax = Math.min(r1.xMax, r2.xMax);
        let yMin = Math.max(r1.yMin, r2.yMin);
        let yMax = Math.min(r1.yMax, r2.yMax);

        if (xMin > xMax || yMin > yMax) {
            return null;
        }
        return cc.rect(xMin, yMin, xMax - xMin, yMax - yMin);
    }

    /**
     * 返回value是否在 [min, max] 区间内
     * @param min 
     * @param max 
     * @param value
     * @param includeEdge true(默认值): [min, max]; false: (min, max)
     */
    public static inRange(min: number, max: number, value: number, includeEdge: boolean = true): boolean {
        return includeEdge ? value >= min && value <= max : value > min && value < max;
    }

    /**
     * 获取区间[min, max)的整数，传入1个参数则区间为[0, min)
     */
    public static randInt(min: number, max: number = undefined): number {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 获取区间[min, max)的浮点数，传入1个参数则区间为[0, min)
     */
    public static randFloat(min: number, max: number = undefined): number {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
    }

    /**
     * 根据权重数组进行随机，返回结果下标
     * @param weightArr 权重数组
     * @returns 随机到的权重数组下标
     */
    public static randWeightIdx(weightArr: number[]) {
        let sum = 0;
        for (let i = 0; i < weightArr.length; i++) {
            sum += weightArr[i];
        }
        let randNum = this.randFloat(0, sum);
        let curValue = 0
        for (let i = 0; i < weightArr.length; i++) {
            curValue += weightArr[i];
            if (randNum < curValue) {
                return i;
            }
        }
        return weightArr.length - 1;
    }

    /**
     * Fisher–Yates shuffle 字符串随机乱序
     */
    public static shuffleString(str: string): string {
        let arr: string[] = [];
        for (let i = 0; i < str.length; i++) {
            arr.push(str[i]);
        }
        arr = this.shuffle(arr);
        str = "";
        arr.forEach((v) => {
            str += v;
        });
        return str;
    }

    /**
     * Fisher–Yates shuffle 数组随机乱序
     */
    public static shuffle<T>(arr: Array<T>): Array<T> {
        for (let i = arr.length - 1; i >= 0; i--) {
            let randomIndex = Math.floor(Math.random() * (i + 1));
            [arr[randomIndex], arr[i]] = [arr[i], arr[randomIndex]];
        }
        return arr;
    }

    /**
     * 随机返回数组中的一个元素
     */
    public static arrayRand<T>(arr: Array<T>): T {
        if (arr.length <= 0) {
            return null;
        }
        return arr[this.randInt(0, arr.length)];
    }

    /**
     * 判断数组中是否有某个元素
     * @param arr 数组
     * @param param 元素值或表达元素值满足某种条件的函数
     */
    public static arrayHas<T>(arr: T[], param: T | ((ele: T) => boolean)): boolean {
        let idx = typeof param !== "function" ? arr.findIndex((e) => { return e === param; }) : arr.findIndex(param as ((ele: T) => boolean));
        return idx >= 0;
    }

    /**
     * 根据下标交换数组两个元素位置
     */
    public static arraySwap<T>(arr: T[], idx1: number, idx2: number): void {
        if (idx1 === idx2 || !this.inRange(0, arr.length - 1, idx1) || !this.inRange(0, arr.length - 1, idx2)) {
            return;
        }
        [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
    }

    /**
     * 将元素从fromIdx位置移到toIdx位置，其余元素相对位置不变
     */
    public static arrayMove<T>(arr: T[], fromIdx: number, toIdx: number): void {
        if (fromIdx === toIdx || !this.inRange(0, arr.length - 1, fromIdx) || !this.inRange(0, arr.length - 1, toIdx)) {
            return;
        }
        let from: T[] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, from[0]);
    }

    /**
     * 在数组中添加某个元素
     * @param canRepeat 是否可重复添加相同元素 默认false
     * @return 是否执行了添加行为
     */
    public static arrayAdd<T>(arr: T[], ele: T, canRepeat: boolean = false): boolean {
        if (!canRepeat && this.arrayHas(arr, ele)) {
            return false;
        }
        arr.push(ele);
        return true;
    }

    /**
     * 在数组中删除某个元素(若有多个相同元素则只删除第一个)
     * @return 是否执行了删除行为
     */
    public static arrayDelete<T>(arr: T[], ele: T): boolean {
        let index: number = arr.findIndex((e) => { return e === ele; });
        if (index >= 0) {
            arr.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * 对单位为秒的时间生成格式化时间字符串
     * @param sec 时间s
     * @param format 格式化字符串
     * @example
     * // 当format为string时，会以format中的最大时间单位进行格式化
     * Tool.formatTimeString(3601, "%{m}:%{s}"); // 60:1
     * Tool.formatTimeString(3601, "%{mm}:%{ss}"); // 60:01
     * Tool.formatTimeString(3601, "%{hh}:%{mm}:%{ss}"); // 01:00:01
     * 
     * // 当format为object时，会以传入的sec计算最大的时间单位，并选择format对应的字符串进行格式化
     * Tool.formatTimeString(100, {
     *     S: "%{s}秒",
     *     M: "%{m}分%{s}秒",
     *     H: "%{h}时%{m}分%{s}秒",
     *     D: "%{d}天%{h}时%{m}分%{s}秒"
     * }); // 1分40秒
     * Tool.formatTimeString(100000, {
     *     S: "%{s}秒",
     *     M: "%{m}分%{s}秒",
     *     H: "%{h}时%{m}分%{s}秒",
     *     D: "%{d}天%{h}时%{m}分%{s}秒"
     * }); // 1天3时46分40秒
     */
    public static formatTimeString(sec: number, format: string | { "S": string; "M": string; "H": string; "D": string } = "%{hh}:%{mm}:%{ss}"): string {
        let seconds: number = Math.floor(sec);
        let minutes: number = Math.floor(seconds / 60);
        let hours: number = Math.floor(seconds / 3600);
        let days: number = Math.floor(seconds / 86400);

        let maxUnit: TimeUnit = TimeUnit.S;
        let result: string = "";

        if (typeof format === "string") {
            // 查询格式化字符串中最大的单位
            result = format;
            if (/d/i.test(format)) {
                maxUnit = TimeUnit.D;
            } else if (/h/i.test(format)) {
                maxUnit = TimeUnit.H;
            } else if (/m/i.test(format)) {
                maxUnit = TimeUnit.M;
            }
        } else {
            // 以传入的数值判断最大单位
            if (days > 0) {
                maxUnit = TimeUnit.D;
                result = format.D;
            } else if (hours > 0) {
                maxUnit = TimeUnit.H;
                result = format.H;
            } else if (minutes > 0) {
                maxUnit = TimeUnit.M;
                result = format.M;
            } else {
                maxUnit = TimeUnit.S;
                result = format.S;
            }
        }

        if (maxUnit > TimeUnit.S) {
            seconds %= 60;
        }
        if (maxUnit > TimeUnit.M) {
            minutes %= 60;
        }
        if (maxUnit > TimeUnit.H) {
            hours %= 24;
        }

        let data = {
            d: `${days}`,
            hh: hours < 10 ? `0${hours}` : `${hours}`,
            h: `${hours}`,
            mm: minutes < 10 ? `0${minutes}` : `${minutes}`,
            m: `${minutes}`,
            ss: seconds < 10 ? `0${seconds}` : `${seconds}`,
            s: `${seconds}`
        };

        for (const key in data) {
            const value = data[key];
            result = result.replace(new RegExp(`%{${key}}`, "g"), value);
        }

        return result;
    }

    /**
     * 子节点递归处理
     * @param node 需要递归处理的节点或节点数组
     * @param cb 节点处理函数
     * @param thisArg cb绑定的this对象
     */
    public static nodeRecursive(node: cc.Node | cc.Node[], cb: (n: cc.Node) => void, thisArg: any = undefined): void {
        if (node instanceof cc.Node) {
            cb.call(thisArg, node);
            node.children.forEach((n: cc.Node) => { this.nodeRecursive(n, cb, thisArg); });
        } else if (Array.isArray(node)) {
            node.forEach((n: cc.Node) => { this.nodeRecursive(n, cb, thisArg); });
        }
    }

    /**
     * destroy并立即remove传入节点的所有子节点
     */
    public static clearChildren(...nodes: cc.Node[]): void {
        nodes.forEach((e) => {
            e.destroyAllChildren();
            e.removeAllChildren();
        });
    }
}
