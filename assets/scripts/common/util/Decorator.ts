/**
 * 装饰器
 */
export default class Decorator {
    //#region 方法装饰器

    /**
     * 用于异步成员方法，多次调用时会按队列顺序依次执行
     * - 对于非静态成员，每一个对象实例都存在一个独立的队列
     * - 对于静态成员，仅存在一个队列
     */
    public static queue() {
        return function (target: any, funcName: string, desc: PropertyDescriptor): void {
            let old = desc.value;
            let queueMap: Map<any, Array<[(value: unknown) => void, (reason?: any) => void, any[]]>> = new Map();
            let queueRun = async function (): Promise<void> {
                let list = queueMap.get(this);
                if (list === undefined) {
                    cc.error(`[Decorator.queue] 队列异常 list is undefined`);
                    return;
                }
                if (list.length === 0) {
                    queueMap.delete(this);
                    return;
                }
                let data = list[0];
                let resolve = data[0];
                let reject = data[1];
                let args = data[2];
                try {
                    let result = await old.apply(this, args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    list.shift();
                    queueRun.apply(this);
                }
            }
            desc.value = function (...args: any[]): Promise<any> {
                return new Promise((resolve, reject) => {
                    let list = queueMap.get(this);
                    if (list === undefined) {
                        list = [];
                        queueMap.set(this, list);
                    }
                    list.push([resolve, reject, args]);
                    if (list.length === 1) {
                        queueRun.apply(this);
                    }
                });
            }
        }
    }

    //#endregion
}