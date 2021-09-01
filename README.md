# Cocos Framework
一个基于Cocos Creator2.4.6的框架

## 目录
- [前言](#preface)
- [演示](#showcase)
- [框架结构](#framework)
    - [动画状态机](#framework-animator)
    - [全局时间管理器](#framework-timer)
    - [全局层级管理](#framework-layer)
    - [全局事件管理器](#framework-events)
    - [音频管理器](#framework-audio)
    - [多语言](#framework-i18n)
    - [一些ui组件](#framework-ui)
    - [常用工具类](#framework-tool)
    - [引擎源码hack](#framework-hack)
    - [几个shader](#framework-shader)
- [命名规范](#name)

## <a id="preface"></a>前言
这套框架是我个人开发过程中的积累，已应用于我个人的几个小项目中。单scene多prefab形式，轻量，各个功能基本都可单独拆解开使用。

## <a id="showcase"></a>演示
部分功能演示地址 https://leeyip.github.io/cocos-framework/



## <a id="framework"></a>框架结构

#### <a id="framework-animator"></a>动画状态机
>文件路径(scripts/animator/)

详见 https://github.com/LeeYip/cocos-animator

#### <a id="framework-timer"></a>全局时间管理器
>文件路径(scripts/common/cmpt/base/Timer.ts)

组件需要绑在场景的根节点或者常驻节点上，由timeScale控制每帧间隔时间的缩放，引入并修改了开源库tween.js\(https://github.com/tweenjs/tween.js\)，在Timer组件内控制。

```typescript
// 执行tween，让node用1000毫秒x坐标移动到100处
new Tween(node)
    .to({x: 100}, 1000)
    .start();

// 执行tween，让node用1000毫秒x坐标移动到100处，实际动画运行时间受timeScale影响
new Tween(node, SCALE_TWEEN)
    .to({x: 100}, 1000)
    .start();
```

- **属性**
    - **`timeScale: number`**  dt缩放倍数，1为正常速度，0为暂停
    - **`realDt: number`**  距上一帧间隔的真实时间
    - **`scaleDt: number`**  距上一帧间隔经过timeScale缩放的时间
- **方法**
    - **`reset()`**  重置timeScale
    - **`gamePause()`**  暂停游戏 timeScale设置为0，发送暂停事件
    - **`gameResume()`**  恢复游戏 timeScale恢复为暂停前的值，发送恢复事件

#### <a id="framework-layer"></a>全局层级管理

>文件路径(scripts/common/cmpt/base/Layer.ts)

组件需要绑在场景的根节点或者常驻节点上，所需的节点层级结构参照项目工程内的Main场景

```typescript
// 弹窗组件需要继承DialogBase，并重写open方法和close方法，用来处理弹窗打开和关闭时的逻辑
export default class DlgExample extends DialogBase {
    public static pUrl: string = 'example/DlgExample';

    /**
     * @override
     */
    public open(num1: number, num2: number) {
        // do something...
    }

    /**
     * @override
     */
    public close() {
        super.close();
        // do something...
    }
}
```

打开一个弹窗，并传递open方法的参数，弹窗prefab路径填写相对于resources/prefab/dialog/下的路径
```typescript
// 建议在弹窗组件类上加一个静态属性pUrl用以标明路径，这样在代码里便于查找和跳转引用
Layer.inst.openUniDialog(DlgExample.pUrl, 1, 2);
// 如果不喜欢上面的方式，也可直接填写路径
Layer.inst.openUniDialog('example/DlgExample', 1, 2);
```

可异步等待某个弹窗关闭
```typescript
await Layer.inst.waitCloseDialog(DlgExample.pUrl);
// 当在某处关闭了DlgExample这个弹窗或当前不存在此弹窗时，才会往下执行
// do something...
```

- **方法**
    - **`enterHome(): Promise<cc.Node>`**  进入主界面
    - **`enterGame(): Promise<cc.Node>`**  进入游戏界面
    - **`getDialog(url: string): DialogBase`**  获取弹窗组件（返回遍历到的第一个）
    - **`openDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开弹窗
    - **`openUniDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开唯一弹窗，同一弹窗只能同时存在一个
    - **`openDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开弹窗
    - **`openUniDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开唯一弹窗，同一弹窗节点只能同时存在一个
    - **`closeDialog(url: string)`**  关闭遍历到的第一个弹窗
    - **`closeDialogs(url: string)`**  关闭所有同路径弹窗
    - **`clearDialogs()`**  关闭所有弹窗
    - **`waitCloseDialog(url: string): Promise<void>`**  异步等待弹窗关闭（只等待遍历到的第一个）
    - **`waitCloseDialogs(url: string): Promise<void>`**  异步等待所有同路径弹窗关闭
    - **`showTip(data: TipData | string)`**  弹出一条文字提示
    - **`clearTips()`**  清空所有提示
    - **`showLoading()`**  打开全局loading遮罩（打开与关闭的调用必须一一对应）
    - **`hideLoading()`**  关闭全局loading遮罩

#### <a id="framework-events"></a>全局事件管理器
>文件路径(scripts/common/util/Events.ts)

全局事件管理，装饰器风格简化事件注册注销，支持异步等待事件监听函数的结束

```typescript
export default class Test extends cc.Component {
    protected onLoad() {
        // 注册当前类使用装饰器绑定的所有事件
        Events.targetOn(this);
    }

    protected onDestroy() {
        // 注销此对象上绑定的所有事件
        Events.targetOff(this);
    }

    // 使用装饰器绑定对应事件监听的函数
    @preloadEvent(EventName.GAME_PAUSE)
    private eventGamePause() {
        
    }

    @preloadEvent(EventName.GAME_RESUME)
    private eventGameResume() {
        
    }

    // 若装饰器第二个参数传true，则触发一次监听函数后会自动注销事件
    @preloadEvent(EventName.TIME_SCALE, true)
    private eventTimeScale() {
        
    }
}
```

当在某处触发事件，对应的监听函数便会被调用，可以给监听函数传参。如果是异步监听函数，也可用await等待所有监听函数执行完毕
```typescript
    // 发送EventName.GAME_PAUSE事件，并传参
    Events.emit(EventName.GAME_PAUSE, 1, ['2']);
    // 也可以await等待所有监听函数执行完毕
    await Events.emitAsync(EventName.GAME_PAUSE);
```

- **装饰器**
    - **`preloadEvent(event: EventName, once: boolean = false)`**  非静态成员函数装饰器，用于预先载入待注册的事件，配合targetOn使用
    
- **方法**
    - **`targetOn(target: Object, onSuper: boolean = true)`**  注册与target构造函数预先绑定的所有事件，配合装饰器preloadEvent使用
    - **`on(event: EventName, cb: (...args: any[]) => void, target: Object, once: boolean = false)`**  注册事件
    - **`once(event: EventName, cb: (...args: any[]) => void, target: Object)`**  注册事件，触发一次后自动注销
    - **`off(event: EventName, cb: (...args: any[]) => void, target: Object)`**  移除事件
    - **`targetOff(target: Object)`**  移除target上注册的所有事件
    - **`emit(event: EventName, ...args: any[])`**  派发事件
    - **`emitAsync(event: EventName, ...args: any[]): Promise<void>`**  派发事件--异步

#### <a id="framework-audio"></a>音频管理器
>文件路径(scripts/common/util/AudioManager.ts)

统一控制bgm和音效的暂停恢复和开关，支持音量渐变播放和渐变停止，支持控制同一音效同时播放的最大数量

- **属性**
    - **`bgmVolume: number`**  全局bgm音量
    - **`sfxVolume: number`**  全局sfx音量
    - **`bgmOff: boolean`**  bgm是否关闭
    - **`sfxOff: boolean`**  sfx是否关闭
    - **`bgmPause: boolean`**  bgm是否暂停
    - **`sfxPause: boolean`**  sfx是否暂停，暂停时不暂停ui音效

- **方法**
    - **`playBgm(args: cc.AudioClip | AudioPlayArgs)`**  播放bgm
    - **`playSfx(args: cc.AudioClip | AudioPlayArgs, type: SfxType = SfxType.NORMAL)`**  播放sfx
    - **`setSfxData(clip: cc.AudioClip, type: SfxType = SfxType.NORMAL, maxNum: number = 8, overStop: boolean = false): SfxData`**  设置音效数据（用于限制某些短时间内同时大量播放的音效）
    - **`stopBgm(clip: cc.AudioClip = null, fadeDuration: number = 0)`**  停止bgm
    - **`stopSfx(clip: cc.AudioClip = null, type: SfxType = SfxType.NORMAL)`**  停止sfx
    - **`stopAll()`**  停止所有音频
    - **`pauseAll()`**  暂停所有音频
    - **`resumeAll()`**  恢复所有音频
    - **`uncacheAll()`**  停止所有音频，清除所有音频缓存

#### <a id="framework-i18n"></a>多语言
>文件路径(scripts/i18n/)

支持文字以及图片的多语言切换，不同语言的同一图片需命名一致，配置路径如下，如需更改配置路径请自行更换。详见工程示例

语言表路径：scripts/i18n/config/En.ts和scripts/i18n/config/Zh.ts

图片路径：resources/textures/localizedImage/en/和resources/textures/localizedImage/zh/


- **属性**
    - **`curLang: LangType`**  当前语言

- **方法**
    - **`init(language: LangType = LangType.NONE)`**  初始化语言
    - **`switch(language: LangType)`**  切换语言
    - **`updateLocalizedCmpt()`**  更新所有多语言组件
    - **`getKeyByValue(value: string): string`**  通过语言表value获取对应的key
    - **`getText(key: string, opt?: any): string`**  获取语言表中的字符串


#### <a id="framework-ui"></a>一些ui组件
>文件路径(scripts/common/cmpt/)
- 虚拟列表VirtualList

    仅生成mask区域内所需的最少节点，且支持节点分层

- 按钮相关
    - 按钮分组，阻止同一分组内的多个按钮同时点击
    - 按钮按下时改变子节点的坐标
- ......

#### <a id="framework-tool"></a>常用工具类
>文件路径(scripts/common/util/)

#### <a id="framework-hack"></a>引擎源码hack
>文件路径(scripts/common/hack/)

#### <a id="framework-shader"></a>几个shader


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