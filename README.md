# Cocos Framework
一个基于Cocos Creator2.4.x的框架

## 目录
- [前言](#preface)
- [范例](#showcase)
- [框架结构](#framework)
- [命名规范](#name)

## <a id="preface"></a>前言
这套框架是我个人开发过程中的积累，已应用于我个人的几个小项目中。单scene多prefab形式，轻量，各个功能基本都可单独拆解开使用。

## <a id="showcase"></a>范例
https://leeyip.github.io/cocos-framework/

## <a id="framework"></a>框架结构
#### 动画状态机
文件路径(scripts/animator/)
- 详见 https://github.com/LeeYip/cocos-animator

#### 全局时间管理器
文件路径(scripts/common/cmpt/base/Timer.ts)

组件需要绑在场景的根节点或者常驻节点上，由timeScale控制每帧间隔时间的缩放，引入并修改了开源库tween.js(https://github.com/tweenjs/tween.js) 在Timer组件内控制。

- 属性
    - **`timeScale: number`**  dt缩放倍数，1为正常速度，0为暂停
    - **`realDt: number`**  距上一帧间隔的真实时间
    - **`scaleDt: number`**  距上一帧间隔经过timeScale缩放的时间
- 方法
    - **`reset()`**  重置timeScale
    - **`gamePause()`**  暂停游戏 timeScale设置为0
    - **`gameResume()`**  恢复游戏 timeScale设置为暂停前的值

#### 全局层级管理
文件路径(scripts/common/cmpt/base/Layer.ts)

组件需要绑在场景的根节点或者常驻节点上，节点层级规则见项目范例

- 方法
    - **`enterHome()`**  进入主界面
    - **`enterGame()`**  进入游戏界面
    - **`getDialog(url: string): DialogBase`**  获取弹窗组件（返回遍历到的第一个）
    - **`openDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开弹窗
    - **`openUniDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开唯一弹窗，同一弹窗只能同时存在一个
    - **`openDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开弹窗
    - **`openUniDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开唯一弹窗，同一弹窗节点只能同时存在一个
    - **`closeDialog(url: string, ...args: any[])`**  关闭遍历到的第一个弹窗
    - **`closeDialogs(url: string, ...args: any[])`**  关闭所有同路径弹窗
    - **`waitCloseDialog(url: string): Promise<void>`**  异步等待弹窗关闭（只等待遍历到的第一个）
    - **`waitCloseDialogs(url: string): Promise<void>`**  异步等待所有同路径弹窗关闭
    - **`showTip(data: TipData | string)`**  弹出一条文字提示
    - **`clearDialogAndTip()`**  清空所有弹窗与提示
    - **`showLoading()`**  打开全局loading遮罩（打开与关闭的调用必须一一对应）
    - **`hideLoading()`**  关闭全局loading遮罩

#### 全局事件管理器
文件路径(scripts/common/util/Events.ts)

全局事件管理，装饰器风格简化事件注册注销，支持异步等待事件监听函数的结束

- 装饰器
    - **`preloadEvent(event: EventName, once: boolean = false)`**  非静态成员函数装饰器，用于预先载入待注册的事件，配合targetOn使用

- 方法
    - **`targetOn(target: Object, onSuper: boolean = true)`**  注册与target构造函数预先绑定的所有事件，配合装饰器preloadEvent使用
    - **`on(event: EventName, cb: (...args: any[]) => void, target: Object, once: boolean = false)`**  注册事件
    - **`once(event: EventName, cb: (...args: any[]) => void, target: Object)`**  注册事件，触发一次后自动注销
    - **`off(event: EventName, cb: (...args: any[]) => void, target: Object)`**  移除事件
    - **`targetOff(target: Object)`**  移除target上注册的所有事件
    - **`emit(event: EventName, ...args: any[])`**  派发事件
    - **`emitAsync(event: EventName, ...args: any[]): Promise<void>`**  派发事件--异步

#### 音频管理器
文件路径(scripts/common/util/AudioManager.ts)

统一控制bgm和音效的暂停恢复和开关，支持音量渐变播放和渐变停止，支持控制同一音效同时播放的最大数量

- 属性
    - **`bgmVolume: number`**  全局bgm音量
    - **`sfxVolume: number`**  全局sfx音量
    - **`bgmOff: boolean`**  bgm是否关闭
    - **`sfxOff: boolean`**  sfx是否关闭
    - **`bgmPause: boolean`**  bgm是否暂停
    - **`sfxPause: boolean`**  sfx是否暂停，暂停时不暂停ui音效

- 方法
    - **`playBgm(args: cc.AudioClip | AudioPlayArgs)`**  播放bgm
    - **`playSfx(args: cc.AudioClip | AudioPlayArgs, type: SfxType = SfxType.NORMAL)`**  播放sfx
    - **`setSfxData(clip: cc.AudioClip, type: SfxType = SfxType.NORMAL, maxNum: number = 8, overStop: boolean = false): SfxData`**  设置音效数据（用于限制某些短时间内同时大量播放的音效）
    - **`stopBgm(clip: cc.AudioClip = null, fadeDuration: number = 0)`**  停止bgm
    - **`stopSfx(clip: cc.AudioClip = null, type: SfxType = SfxType.NORMAL)`**  停止sfx
    - **`stopAll()`**  停止所有音频
    - **`pauseAll()`**  暂停所有音频
    - **`resumeAll()`**  恢复所有音频
    - **`uncacheAll()`**  停止所有音频，清除所有音频缓存

#### 多语言
文件路径(scripts/i18n/)

支持文字以及图片的多语言切换

- 属性
    - **`curLang: LangType`**  当前语言

- 方法
    - **`init(language: LangType = LangType.NONE)`**  初始化语言
    - **`switch(language: LangType)`**  切换语言
    - **`updateLocalizedCmpt()`**  更新所有多语言组件
    - **`getKeyByValue(value: string): string`**  通过语言表value获取对应的key
    - **`getText(key: string, opt?: any): string`**  获取语言表中的字符串

#### 一些ui组件
文件路径(scripts/common/cmpt/)
- 虚拟列表VirtualList
- ......
#### 常用工具类
文件路径(scripts/common/util/)
#### 对引擎源码的hack
文件路径(scripts/common/hack/)
#### 几个shader


## <a id="name"></a>命名规范
- 文件夹使用小驼峰 files
- 文件名使用大驼峰 File.ts
- 类名使用大驼峰 FileClass
- 属性名、函数名使用小驼峰 func（个人习惯property装饰的属性使用大驼峰）
- 枚举
```
enum LangType {
    NONE = '',
    ZH = 'zh',
    EN = 'en'
}
```
