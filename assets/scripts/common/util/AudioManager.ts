import { Tween } from "./Tween";

/**
 * 音效类型
 */
export enum SfxType {
    NORMAL,
    UI
}

/**
 * Audio缓存数据
 */
interface AudioData {
    /** audioID */
    id: number;
    /** 用于单独控制的音量 */
    volume: number;
    /** 音量渐变tween对象 */
    tween: Tween<AudioData>;
}

/**
 * 单个AudioClip对应的sfx(音效)缓存数据
 */
interface SfxData {
    /** 已缓存的音效数据数组 */
    audioList: AudioData[];
    /** 此音效最大同时播放的数量 */
    maxNum: number;
    /** 超过最大数量时是否stop未播完的音效并缓存新的音效 */
    overStop: boolean;
}

/**
 * 音频管理类
 */
export default class AudioManager {
    /** 缓存的bgm数据 */
    private static _bgmMap: Map<cc.AudioClip, AudioData> = new Map();
    /** 缓存的普通音效数据 */
    private static _normalSfxMap: Map<cc.AudioClip, SfxData> = new Map();
    /** 缓存的ui音效数据 */
    private static _uiSfxMap: Map<cc.AudioClip, SfxData> = new Map();

    private static _bgmVolume: number = 1;
    /** 全局bgm音量 */
    public static get bgmVolume() {
        return this._bgmVolume;
    }
    public static set bgmVolume(volume: number) {
        if (this._bgmVolume === volume) {
            return;
        }

        this._bgmVolume = cc.misc.clampf(volume, 0, 1);
        this._bgmMap.forEach((audioData: AudioData, clip: cc.AudioClip) => {
            cc.audioEngine.setVolume(audioData.id, this._bgmVolume * audioData.volume);
        });
    }

    private static _sfxVolume: number = 1;
    /** 全局sfx音量 */
    public static get sfxVolume() {
        return this._sfxVolume;
    }
    public static set sfxVolume(volume: number) {
        if (this._sfxVolume === volume) {
            return;
        }

        this._sfxVolume = cc.misc.clampf(volume, 0, 1);
        this._normalSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
            data.audioList.forEach((audioData: AudioData) => {
                cc.audioEngine.setVolume(audioData.id, this._sfxVolume * audioData.volume);
            });
        });
        this._uiSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
            data.audioList.forEach((audioData: AudioData) => {
                cc.audioEngine.setVolume(audioData.id, this._sfxVolume * audioData.volume);
            });
        });
    }

    private static _bgmOff: boolean = false;
    /** bgm是否关闭 */
    public static get bgmOff() {
        return this._bgmOff;
    }
    public static set bgmOff(isOff: boolean) {
        if (this._bgmOff === isOff) {
            return;
        }
        this._bgmOff = isOff;

        if (this._bgmOff) {
            this._bgmMap.forEach((audioData: AudioData, clip: cc.AudioClip) => {
                audioData.tween && audioData.tween.stop();
                audioData.tween = null;
                cc.audioEngine.stop(audioData.id);
            });
            this._bgmMap.clear();
        }
    }

    private static _sfxOff: boolean = false;
    /** sfx是否关闭 */
    public static get sfxOff() {
        return this._sfxOff;
    }
    public static set sfxOff(isOff: boolean) {
        if (this._sfxOff === isOff) {
            return;
        }

        this._sfxOff = isOff;
        if (this._sfxOff) {
            this._normalSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.stop(audioData.id);
                });
                data.audioList.length = 0;
            });
            this._uiSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.stop(audioData.id);
                });
                data.audioList.length = 0;
            });
        }
    }

    private static _bgmPause: boolean = false;
    /** bgm是否暂停 */
    public static get bgmPause() {
        return this._bgmPause;
    }
    public static set bgmPause(isPause: boolean) {
        if (this.bgmOff || this._bgmPause === isPause) {
            return;
        }
        this._bgmPause = isPause;

        this._bgmMap.forEach((data: AudioData, clip: cc.AudioClip) => {
            if (this._bgmPause) {
                data.tween && data.tween.pause();
                cc.audioEngine.pause(data.id);
            } else {
                data.tween && data.tween.resume();
                cc.audioEngine.resume(data.id);
            }
        });
    }

    private static _sfxPause: boolean = false;
    /** sfx是否暂停，暂停时不暂停ui音效 */
    public static get sfxPause() {
        return this._sfxPause;
    }
    public static set sfxPause(isPause: boolean) {
        if (this.sfxOff || this._sfxPause === isPause) {
            return;
        }
        this._sfxPause = isPause;

        if (this._sfxPause) {
            this._normalSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.pause(audioData.id);
                });
            });
        } else {
            this._normalSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.resume(audioData.id);
                });
            });
        }

    }

    /**
     * 音量渐变
     * @param data 
     * @param duration 音量渐变时长 单位ms
     * @param from 音量初始值
     * @param to 音量目标值
     * @param call 渐变结束的回调
     */
    private static volumeFade(data: AudioData, duration: number, from: number, to: number, call?: () => void) {
        data.tween && data.tween.stop();
        data.volume = from;
        cc.audioEngine.setVolume(data.id, data.volume * this.bgmVolume);
        data.tween = new Tween(data)
            .to({ volume: to }, duration)
            .onUpdate(() => {
                cc.audioEngine.setVolume(data.id, data.volume * this.bgmVolume);
            })
            .onComplete(() => {
                data.tween = null;
                if (call) {
                    call();
                }
            })
            .start();
    }

    /**
     * 播放音频并返回AudioData
     */
    private static play(clip: cc.AudioClip, loop: boolean, volume: number, finishCall: () => {} = null, audioData: AudioData = null): AudioData {
        if (audioData) {
            audioData.id = cc.audioEngine.play(clip, loop, volume);
            audioData.volume = 1;
            if (audioData.tween) {
                audioData.tween.stop();
                audioData.tween = null;
            }
        } else {
            audioData = {
                id: cc.audioEngine.play(clip, loop, volume),
                volume: 1,
                tween: null
            };
        }

        if (finishCall) {
            cc.audioEngine.setFinishCallback(audioData.id, finishCall);
        }
        return audioData;
    }

    /**
     * 播放bgm
     * @param clip 
     * @param loop 是否循环
     * @param fadeDuration 音量渐变时长 单位ms
     * @param finishCall 正常播放结束时的回调
     */
    public static playBgm(clip: cc.AudioClip, loop: boolean = true, fadeDuration: number = 0, finishCall: () => {} = null) {
        if (this.bgmOff || !clip) {
            return;
        }

        let audioData: AudioData = this._bgmMap.get(clip);
        if (audioData === undefined) {
            audioData = this.play(clip, loop, this.bgmVolume, finishCall);
            this._bgmMap.set(clip, audioData);
        } else {
            cc.audioEngine.stop(audioData.id);
            this.play(clip, loop, this.bgmVolume, finishCall, audioData);
        }

        if (fadeDuration > 0) {
            this.volumeFade(audioData, fadeDuration, 0, 1);
        }
    }

    /**
     * 播放sfx
     * @param clip 
     * @param type 音效类型
     * @param finishCall 正常播放结束时的回调
     */
    public static playSfx(clip: cc.AudioClip, type: SfxType = SfxType.NORMAL, finishCall: () => {} = null) {
        if (this.sfxOff || !clip) {
            return;
        }

        let sfxData: SfxData = type === SfxType.NORMAL ? this._normalSfxMap.get(clip) : this._uiSfxMap.get(clip);
        let audioData: AudioData = null;
        if (sfxData === undefined) {
            sfxData = this.setSfxData(clip, type);
            audioData = this.play(clip, false, this.sfxVolume, finishCall);
            sfxData.audioList.push(audioData);
        } else {
            // 剔除不处于播放状态的音频
            while (sfxData.audioList.length > 0 && cc.audioEngine.getState(sfxData.audioList[0].id) !== cc.audioEngine.AudioState.PLAYING) {
                cc.audioEngine.stop(sfxData.audioList.shift().id);
            }

            // 已达到最大数量则剔除最先(第一个)缓存的音频
            while (sfxData.overStop && sfxData.audioList.length >= sfxData.maxNum) {
                cc.audioEngine.stop(sfxData.audioList.shift().id);
            }

            // 缓存新的音频
            if (sfxData.audioList.length < sfxData.maxNum) {
                audioData = this.play(clip, false, this.sfxVolume, finishCall);
                sfxData.audioList.push(audioData);
            }
        }
    }

    /**
     * 设置音效数据(用于控制某些短时间内同时大量播放的音效)
     * @param clip 
     * @param type 音效类型
     * @param maxNum 此音效最大同时播放的数量
     * @param overStop 超过最大数量时是否stop未播完的音效并缓存新的音效
     */
    public static setSfxData(clip: cc.AudioClip, type: SfxType = SfxType.NORMAL, maxNum: number = 8, overStop: boolean = false): SfxData {
        if (!clip) {
            return;
        }

        maxNum = Math.max(maxNum, 1);
        let map = type === SfxType.NORMAL ? this._normalSfxMap : this._uiSfxMap;
        let sfxData: SfxData = map.get(clip);
        if (sfxData === undefined) {
            sfxData = {
                audioList: [],
                maxNum: maxNum,
                overStop: overStop
            };
            map.set(clip, sfxData);
        } else {
            sfxData.maxNum = maxNum;
            sfxData.overStop = overStop;
        }
        return sfxData;
    }

    /**
     * 停止bgm
     * @param clip 需停止的音频，clip返回值为false则停止所有
     * @param fadeDuration 音量渐变时长 单位ms
     */
    public static stopBgm(clip: cc.AudioClip = null, fadeDuration: number = 0) {
        if (this.bgmOff) {
            return;
        }

        if (clip) {
            let audioData: AudioData = this._bgmMap.get(clip);
            if (audioData === undefined) {
                return;
            }

            audioData.tween && audioData.tween.stop();
            audioData.tween = null;
            if (fadeDuration <= 0) {
                cc.audioEngine.stop(audioData.id);
                this._bgmMap.delete(clip);
            } else {
                this.volumeFade(audioData, fadeDuration, 1, 0, () => {
                    cc.audioEngine.stop(audioData.id);
                    this._bgmMap.delete(clip);
                });
            }
        } else {
            if (fadeDuration <= 0) {
                this._bgmMap.forEach((audioData: AudioData, clip: cc.AudioClip) => {
                    audioData.tween && audioData.tween.stop();
                    audioData.tween = null;
                    cc.audioEngine.stop(audioData.id);
                });
                this._bgmMap.clear();
            } else {
                this._bgmMap.forEach((audioData: AudioData, clip: cc.AudioClip) => {
                    audioData.tween && audioData.tween.stop();
                    audioData.tween = null;
                    this.volumeFade(audioData, fadeDuration, 1, 0, () => {
                        cc.audioEngine.stop(audioData.id);
                        this._bgmMap.delete(clip);
                    });
                });
            }
        }
    }

    /**
     * 停止sfx
     * @param clip 需停止的音频，clip返回值为false则停止所有
     * @param type 音效类型
     */
    public static stopSfx(clip: cc.AudioClip = null, type: SfxType = SfxType.NORMAL) {
        if (this.sfxOff) {
            return;
        }

        if (clip) {
            let data: SfxData = type === SfxType.NORMAL ? this._normalSfxMap.get(clip) : this._uiSfxMap.get(clip);
            if (data === undefined || data.audioList.length <= 0) {
                return;
            }

            data.audioList.forEach((audioData: AudioData) => {
                cc.audioEngine.stop(audioData.id);
            });
            data.audioList.length = 0;
        } else {
            this._normalSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.stop(audioData.id);
                });
                data.audioList.length = 0;
            });
            this._uiSfxMap.forEach((data: SfxData, clip: cc.AudioClip) => {
                data.audioList.forEach((audioData: AudioData) => {
                    cc.audioEngine.stop(audioData.id);
                });
                data.audioList.length = 0;
            });
        }
    }

    /**
     * 停止所有音频
     */
    public static stopAll() {
        this.stopBgm();
        this.stopSfx();
    }

    /**
     * 暂停所有音频
     */
    public static pauseAll() {
        this.bgmPause = true;
        this.sfxPause = true;
    }

    /**
     * 恢复所有音频
     */
    public static resumeAll() {
        this.bgmPause = false;
        this.sfxPause = false;
    }

    /**
     * 停止所有音频，清除所有音频缓存
     */
    public static uncacheAll() {
        this.stopAll();
        this._bgmMap.clear();
        this._normalSfxMap.clear();
        this._uiSfxMap.clear();
        cc.audioEngine.uncacheAll();
    }
}
