import { Group, Tween, TWEEN } from "./Tween";

/**
 * 工具类
 */
export default class Tool {
    /**
     * 深拷贝
     * @param source 源数据
     */
    public static deepCopy<T>(source: T): T {
        if (typeof source !== 'object' || source === null || source instanceof RegExp) {
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
     * @param includeEdge 是否包含边界值min和max，默认包含
     */
    public static inRange(min: number, max: number, value: number, includeEdge: boolean = true) {
        return includeEdge ? value >= min && value <= max : value > min && value < max;
    }

    /**
     * 获取区间[min, max)的整数，传入1个参数则区间为[0, min)
     */
    public static randInt(min: number, max: number = undefined) {
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
    public static randFloat(min: number, max: number = undefined) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
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
        str = '';
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
    public static arraySwap<T>(arr: T[], idx1: number, idx2: number) {
        if (idx1 === idx2 || !this.inRange(0, arr.length - 1, idx1) || !this.inRange(0, arr.length - 1, idx2)) {
            return;
        }
        [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
    }

    /**
     * 将元素从fromIdx位置移到toIdx位置，其余元素相对位置不变
     */
    public static arrayMove<T>(arr: T[], fromIdx: number, toIdx: number) {
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
     * 子节点递归处理
     * @param node 需要递归处理的节点或节点数组
     * @param cb 节点处理函数
     * @param thisArg cb绑定的this对象
     */
    public static nodeRecursive(node: cc.Node | cc.Node[], cb: (n: cc.Node) => void, thisArg: any = undefined) {
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
    public static clearChildren(...nodes: cc.Node[]) {
        nodes.forEach((e) => {
            e.destroyAllChildren();
            e.removeAllChildren();
        });
    }
}
