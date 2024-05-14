import Tool from "./Tool";

type AsyncData = [(value: unknown) => void, (reason?: unknown) => void, unknown[]];

/** 异步成员方法 */
interface AsyncProperty extends PropertyDescriptor {
    value?: (...args: unknown[]) => Promise<unknown>;
}

/**
 * 工具装饰器
 */
export default class Decorator {
    //#region 方法装饰器

    /**
     * 异步方法装饰器，多次调用时会按队列顺序依次执行
     * - 对于非静态成员，每一个对象实例都存在一个独立的队列
     * - 对于静态成员，仅存在一个队列
     */
    public static queue(target: unknown, funcName: string, desc: AsyncProperty): void {
        let old = desc.value;
        let queueMap: Map<unknown, AsyncData[]> = new Map();
        let queueRun = async function (): Promise<void> {
            let queue = queueMap.get(this);
            if (queue === undefined) {
                cc.error(`[Decorator.queue] error: queue is undefined`);
                return;
            }
            if (queue.length === 0) {
                queueMap.delete(this);
                return;
            }
            let data = queue[0];
            let resolve = data[0];
            let reject = data[1];
            let args = data[2];
            try {
                let result = await old.apply(this, args);
                resolve(result);
            } catch (error) {
                reject(error);
            } finally {
                queue.shift();
                queueRun.apply(this);
            }
        };
        desc.value = function (...args: unknown[]): Promise<unknown> {
            return new Promise((resolve, reject) => {
                let queue = queueMap.get(this);
                if (queue === undefined) {
                    queue = [];
                    queueMap.set(this, queue);
                }
                queue.push([resolve, reject, args]);
                if (queue.length === 1) {
                    queueRun.apply(this);
                }
            });
        };
    }

    /**
     * 异步方法装饰器，在异步方法未返回结果时，若同时多次调用仅会执行一次（返回首次调用的Promise）
     * - 对于非静态成员，每一个对象实例都存在一个独立的调用队列
     * - 对于静态成员，仅存在一个调用队列
     */
    public static onceWhileExecuting(target: unknown, funcName: string, desc: AsyncProperty): void {
        let old = desc.value;
        let promiseMap: Map<unknown, Promise<unknown>> = new Map();
        desc.value = function (...args: unknown[]): Promise<unknown> {
            let promise = promiseMap.get(this);
            if (promise !== undefined) {
                return promise;
            }
            promise = new Promise((resolve, reject) => {
                old.apply(this, args).then((result: unknown) => {
                    promiseMap.delete(this);
                    resolve(result);
                }).catch((error: unknown) => {
                    promiseMap.delete(this);
                    reject(error);
                })
            });
            promiseMap.set(this, promise);
            return promise;
        };
    }

    /**
     * 方法装饰器，方法开始执行至执行完毕后锁定一段时间，期间忽略所有对该方法的调用
     * - 忽略调用时不会有返回值
     * @param seconds 锁定的秒数
     */
    public static lock(seconds: number = 0): (target: unknown, funcName: string, desc: PropertyDescriptor) => void {
        return function (target: unknown, funcName: string, desc: PropertyDescriptor): void {
            let old = desc.value;
            let callingSet: Set<unknown> = new Set();
            desc.value = function (...args: unknown[]): unknown {
                if (callingSet.has(this)) {
                    return;
                }
                callingSet.add(this);
                let result = old.apply(this, args);
                if (result instanceof Promise) {
                    return new Promise((resolve, reject) => {
                        result.then((value: unknown) => {
                            Tool.wait(Math.max(seconds, 0)).then(() => { callingSet.delete(this); });
                            resolve(value);
                        }, (reason: unknown) => {
                            Tool.wait(Math.max(seconds, 0)).then(() => { callingSet.delete(this); });
                            reject(reason);
                        });
                    });
                } else {
                    Tool.wait(Math.max(seconds, 0)).then(() => { callingSet.delete(this); });
                    return result;
                }
            };
        };
    }

    //#endregion
}
