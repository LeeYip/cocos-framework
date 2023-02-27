# Cocos Framework
一个基于Cocos Creator2.4.11的框架

## 目录
- [前言](#preface)
- [演示](#showcase)
- [框架结构](#framework)
    - [动画状态机](#framework-animator)
    - [全局时间管理器](#framework-timer)
    - [全局弹窗管理器](#framework-layer)
    - [全局事件管理器](#framework-events)
    - [资源管理器](#framework-res)
    - [音频管理器](#framework-audio)
    - [多语言](#framework-i18n)
    - [常用ui组件](#framework-ui)
    - [常用工具类](#framework-tool)
    - [引擎源码hack](#framework-hack)
    - [几个shader](#framework-shader)
- [命名规范](#name)
- [参考资料](#reference)

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

组件在场景加载后会自动绑定常驻节点，由timeScale控制每帧间隔时间的缩放。引入并修改了开源库tween.js，在Timer组件中更新和控制，使用方式请参考 https://github.com/tweenjs/tween.js

关于我对tween.js的修改
1. 设置了新的Group，用以执行受timeScale影响的tween动画
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

2. 加入了新的接口`bindCCObject(obj: cc.Object)`，可以将tween与cc.Node或cc.Component等类型为cc.Object的对象进行绑定。当Node或Component被销毁时，与之绑定的tween也会自动销毁。
```typescript
// 比如构造参数使用cc.Node
let node: cc.Node;
let tween = new Tween(node)
    .to({x: 100}, 1000)
    .start();
// node销毁后，不需要手动销毁tween，框架内部会自动销毁
node.destory();


// 或者主动绑定一个cc.Object类型的对象
let comp: cc.Component;
let tween = new Tween({a: 1})
    .to({a: 10}, 1000)
    .start()
    .bindCCObject(comp);
// 当comp销毁后，同样tween也会自动销毁
comp.destory();
```

- **属性**
    - **`timeScale: number`**  dt缩放倍数，1为正常速度，0为暂停。修改时触发时间缩放值修改事件
    - **`realDt: number`**  距上一帧间隔的真实时间
    - **`scaleDt: number`**  距上一帧间隔经过timeScale缩放的时间
- **方法**
    - **`reset()`**  重置timeScale，触发timeScale事件
    - **`gamePause()`**  暂停游戏 timeScale设置为0，触发暂停事件
    - **`gameResume()`**  恢复游戏 timeScale恢复为暂停前的值，触发恢复事件

#### <a id="framework-layer"></a>全局弹窗管理器

>文件路径(scripts/common/cmpt/base/Layer.ts)

组件需要绑在场景的根节点或者常驻节点上，所需的节点层级结构参照项目工程内的Main场景

```typescript
// 弹窗组件需要继承DialogBase，并重写onOpen方法和onClose方法，用来处理弹窗打开和关闭时的逻辑
export default class DlgExample extends DialogBase {
    public static pUrl: string = "example/DlgExample";

    /**
     * @override
     */
    public onOpen(num1: number, num2: number) {
        // do something...
    }

    /**
     * @override
     */
    public onClose() {
        // do something...
    }
}
```

打开一个弹窗，并传递onOpen方法的参数，弹窗prefab路径规则与[资源管理器](#framework-res)加载路径规则相同
```typescript
// 建议在弹窗组件类上加一个静态属性pUrl用以标明路径，这样在代码里便于查找和跳转引用
Layer.inst.openUniDialog(DlgExample.pUrl, 1, 2);
// 如果不喜欢上面的方式，也可直接填写路径
Layer.inst.openUniDialog("example/DlgExample", 1, 2);
```

可异步等待某个弹窗关闭
```typescript
await Layer.inst.waitCloseDialog(DlgExample.pUrl);
// 当在某处关闭了DlgExample这个弹窗或当前不存在此弹窗时，才会往下执行
// do something...
```

- **方法**
    - **`enterMain(): Promise<cc.Node | null>`**  进入常驻界面，并清空dialog与tip（不同于dialog，常驻界面始终显示在最底层，且同时只会存在一个）
    - **`getDialog(url: string): DialogBase`**  获取弹窗组件（返回遍历到的第一个）
    - **`openDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开弹窗
    - **`openUniDialog(url: string, ...args: any[])`**  （同步方法，需确保事先已加载预制资源）打开唯一弹窗，同一弹窗只能同时存在一个
    - **`openDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开弹窗
    - **`openUniDialogAsync(url: string, ...args: any[]): Promise<void>`**  （异步方法）打开唯一弹窗，同一弹窗节点只能同时存在一个
    - **`closeDialog(url: string, play: boolean = false)`**  关闭遍历到的第一个弹窗
    - **`closeDialogs(url: string = "", play: boolean = false)`**  关闭所有同路径弹窗，不传参则关闭所有弹窗
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
        // 注册当前类使用preloadEvent装饰器绑定的所有事件
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

或者也可使用类装饰器覆盖onLoad和onDestroy方法，并分别在其中调用targetOn与targetOff
```typescript
// 参数为false则只注册当前类用preloadEvent绑定的事件
// 参数为true则会注册当前类以及父类用preloadEvent绑定的事件
@eventsOnLoad(true) // 也可使用@eventsOnEnable，对应于onEnable和onDisable
export default class Test extends cc.Component {
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
    Events.emit(EventName.GAME_PAUSE, 1, ["2"]);
    // 也可以await等待所有监听函数执行完毕
    await Events.emitAsync(EventName.GAME_PAUSE);
```

- **装饰器**
    - **`eventsOnLoad(onSuper: boolean = true)`** 类装饰器。用于覆盖onLoad和onDestroy方法，在onLoad中注册preloadEvent绑定的所有事件，在onDestroy注销绑定的所有事件
    - **`eventsOnEnable(onSuper: boolean = true)`** 类装饰器。用于覆盖onEnable和onDisable方法，在onEnable中注册preloadEvent绑定的所有事件，在onDisable注销绑定的所有事件
    - **`preloadEvent(event: EventName, once: boolean = false)`**  非静态成员函数装饰器。用于预先载入待注册的事件，配合eventsOnLoad、eventsOnEnable、targetOn使用
    
- **方法**
    - **`targetOn(target: Object, onSuper: boolean = true)`**  注册与target构造函数预先绑定的所有事件，配合装饰器preloadEvent使用
    - **`on(event: EventName, cb: (...args: any[]) => void, target: Object, once: boolean = false)`**  注册事件
    - **`once(event: EventName, cb: (...args: any[]) => void, target: Object)`**  注册事件，触发一次后自动注销
    - **`off(event: EventName, cb: (...args: any[]) => void, target: Object)`**  移除事件
    - **`targetOff(target: Object)`**  移除target上注册的所有事件
    - **`emit(event: EventName, ...args: any[])`**  派发事件
    - **`emitAsync(event: EventName, ...args: any[]): Promise<void>`**  派发事件--异步

#### <a id="framework-res"></a>资源管理器
>文件路径(scripts/common/util/Res.ts)

主要是对prefab、图片等进行资源管理，内部自动进行引用计数的加减，可保证资源的安全释放。

资源加载：
1. 如果加载resources内的资源，直接写明resources内的路径即可
2. 如果加载路径以ab:开头，则会加载对应bundle内的资源。例：ab:bundleA/xxx/a表示bundle名为bundleA，资源路径为xxx/a
```typescript
// 加载resources内的资源（项目下完整路径为assets/resources/xxx/a.png）
let sf = await Res.load<cc.SpriteFrame>("xxx/a", cc.SpriteFrame);

// 加载bundle内的资源（项目下完整路径为assets/bundleA/xxx/a.png，其中bundleA为包名）
let sf = await Res.load<cc.SpriteFrame>("ab:bundleA/xxx/a", cc.SpriteFrame);
```

引用计数管理：
1. 尽量使用此类的接口加载所有资源、instantiate节点实例，否则需要自行管理引用计数
2. Res.instantiate不要对动态生成的节点使用，尽量只instantiate prefab上预设好的节点，否则有可能会导致引用计数的管理出错
3. 调用load接口时如需传入release参数，则同一资源在全局调用load时release参数尽量保持一致，否则可能不符合预期
4. 请使用ResSpine、ResSprite组件去动态加载spine、图片资源，否则需要自行管理这些资源的引用计数
```typescript
// 请使用Res.instantiate代替cc.instantiate去获取节点实例
let node: cc.Node = Res.instantiate(prefab);

// ResSpine、ResSprite组件负责自动管理引用计数
// 请使用ResSprite去动态加载或者动态设置spriteFrame
resSpr.setSpriteFrame("xxx/a");
resSpr.spriteFrame = sf;
```

资源释放：
```typescript
// 设置资源可被释放的间隔时间，资源超过此间隔未被再次load才可释放
Res.releaseSec = 60;

// 尝试进行缓存资源的释放
// 只要遵守上述规则，此接口不会导致正在被使用的资源被引擎释放，可放心使用
Res.releaseAll();
```

- **属性**
    - **`releaseSec: number`**  资源释放的间隔时间（秒），资源超过此间隔未被load才可释放

- **方法**
    - **`get<T extends cc.Asset>(url: string, type: typeof cc.Asset): T`**  获取缓存资源。通常不应直接调用此接口，除非调用前能确保资源已加载并且能自行管理引用计数
    - **`loadBundle(nameOrUrl: string): Promise<cc.AssetManager.Bundle>`** 加载bundle
    - **`load<T extends cc.Asset>(url: string, type: typeof cc.Asset, release: boolean = true): Promise<T | null>`**  加载单个资源
    - **`loadDir<T extends cc.Asset>(url: string, type: typeof cc.Asset, release: boolean = true): Promise<T[]>`**  加载某个文件夹内的某类资源
    - **`instantiate(original: cc.Node | cc.Prefab, related?: cc.Node | cc.Prefab): cc.Node`**  获取节点实例，并建立新节点与prefab资源的联系
    - **`releaseAll()`**  尝试释放所有缓存资源

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
>文件路径(scripts/common/util/I18n.ts)

支持文字以及图片的多语言切换，不同语言的同一图片需命名一致，配置路径如下，如需更改配置路径请自行更换。详见工程示例

>UI组件路径: scripts/common/cmpt/ui/i18n/

>语言表路径：scripts/common/config/En.ts和scripts/common/config/Zh.ts

>图片路径：resources/textures/localizedImage/en/和resources/textures/localizedImage/zh/


如果需要替换字符串中的占位符（形如"**%{xxx}**"的字符串为占位符），支持以下两种不同的传参形式来获取替换后的字符串
```typescript
// 语言表 {"test": "test %{arg1} %{arg2} !!!"}
I18n.getText("test", {arg1: "somthing", arg2: 2}); // => "test somthing 2 !!!"
I18n.getText("test", "somthing", 2); // => "test somthing 2 !!!"
```

- **属性**
    - **`curLang: LangType`**  当前语言类型

- **方法**
    - **`init(language: LangType = LangType.NONE)`**  初始化语言
    - **`switch(language: LangType)`**  切换语言
    - **`updateLocalizedCmpt()`**  更新所有多语言组件
    - **`getKeyByValue(value: string): string`**  通过语言表value获取对应的key
    - **`getText(key: string, ...option: [{ [k: string]: string | number }] | Array<string | number>): string`**  通过key获取语言表中的字符串


#### <a id="framework-ui"></a>常用ui组件
>文件路径(scripts/common/cmpt/)
- **VirtualList** 虚拟列表，仅生成视图区域内所需的最少节点，且支持节点分层

- **LoopList** 无限循环列表/轮播图

- **CircleList** 环形列表，将节点以椭圆排列

- **AnimValue** 渐变动画组件基类，可基于此组件实现各种数值渐变动画
    - **AnimValueLabel** 数字渐变动画组件
    - **AnimValueProgress** 进度条渐变动画组件
    - **AnimValueProgressHP** 游戏血条组件

- 按钮组件
    - **ButtonSingle** 按钮分组，阻止同一分组内的多个按钮同时点击
    - **ButtonChildPos** 根据按钮状态改变子节点的坐标
    - **ButtonChildGray** 根据按钮状态将子节点置灰

- 资源管理组件，结合[资源管理器](#framework-res)，自动管理动态加载的资源引用计数
    - **ResSpine**
    - **ResSprite**

- **MultiSprite** 基于Multi-Texture<sup>[[1]](#reference1)</sup>实现的渲染组件，支持多图集合批，需通过**MultiTextureManager**管理合批的纹理
    - 兼容web与native
    - 支持Sprite的simple、sliced、tiled、filled渲染类型
    - 支持Cocos自动图集与动态合图的纹理
    - 支持动态修改合批的纹理--**MultiTextureManager.setTexture(idx: number, tex: cc.Texture2D)**

- ......

#### <a id="framework-tool"></a>常用工具类
>文件路径(scripts/common/util/)
- **Tool** 常用工具方法
- **Decorator** 装饰器

#### <a id="framework-hack"></a>引擎源码hack
>文件路径(scripts/common/hack/)

#### <a id="framework-shader"></a>几个shader
>文件路径(res/shader/)

## <a id="name"></a>命名规范
- 文件夹使用小驼峰 files
- 文件名使用大驼峰 File.ts
- 类名使用大驼峰 FileClass
- 属性名、函数名使用小驼峰 func
- 枚举
```
enum LangType {
    NONE = "",
    ZH = "zh",
    EN = "en"
}
```
- 字符串尽量使用双引号

## <a id="reference"></a>参考资料
1. <a id="reference1"></a>https://forum.cocos.org/t/topic/121618
