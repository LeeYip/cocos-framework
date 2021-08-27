import Tool from "./Tool";

const CHARS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

/**
 * 可设置随机种子的随机数生成器
 */
export default class Random {

    /**
     * 计算字符串的hash值 返回值>=0
     * @param str 
     */
    public static hashCode(str: string) {
        let hash = 0;
        if (!str) {
            return hash;
        }

        for (let i = 0; i < str.length; i++) {
            hash = 31 * hash + str.charCodeAt(i);
            hash %= 233280;
        }
        return hash;
    }

    /**
     * 随机生成一个种子编码
     * @param length 编码字节长度
     */
    public static getSeed(length: number = 8): string {
        let seed = '';
        for (let i = 0; i < length; i++) {
            seed += Tool.arrayRand(CHARS);
        }
        return seed;
    }

    /**
     * 获取区间[0, 1)的浮点数
     */
    public static random(seed: string | number) {
        let seedCode: number = typeof seed === 'string' ? this.hashCode(seed) : seed;
        return (seedCode * 9301 + 49297) % 233280 / 233280;
    }

    /**
     * 获取区间[min, max)的整数，传入1个参数则区间为[0, arg1)
     */
    public static int(seed: string | number, min: number, max: number = undefined) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(this.random(seed) * (max - min)) + min;
    }

    /**
     * 获取区间[min, max)的浮点数，传入1个参数则区间为[0, arg1)
     */
    public static float(seed: string | number, min: number, max: number = undefined) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return this.random(seed) * (max - min) + min;
    }
}
