# Cocos Framework
一个基于Cocos Creator2.4.x的框架

## 目录
- [前言](#preface)
- [框架结构](#framework)
- [范例](#showcase)

## <a id="preface"></a>前言
这套框架是我个人开发过程中的积累，已应用于我个人的几个小项目中。单scene多prefab形式，轻量，各个功能基本都可单独拆解开使用。

## <a id="framework"></a>框架结构
#### 动画状态机
项目路径(assets/scripts/animator/)
- 详见 https://github.com/LeeYip/cocos-animator
#### 全局时间管理器
项目路径(assets/scripts/common/cmpt/base/Timer.ts)
- timeScale 控制每帧间隔时间的缩放
- 引入Tween.js https://github.com/tweenjs/tween.js
#### 全局层级管理
项目路径(assets/scripts/common/cmpt/base/Layer.ts)
- 主界面和游戏界面切换
- 弹窗管理
- 全局loading遮罩
- 全局文字提示
#### 全局事件管理器
项目路径(assets/scripts/common/util/Tool.ts)
- 装饰器风格简化事件注册注销
- 支持异步等待事件监听函数的结束
#### 音频管理器
项目路径(assets/scripts/common/util/AudioManager.ts)
- 统一控制bgm和音效的暂停恢复和开关
- 支持音量渐变播放和渐变停止
- 支持控制同一音效同时播放的最大数量
#### 多语言
项目路径(assets/scripts/i18n/)
- 支持文字以及图片的多语言切换
#### 一些ui组件
项目路径(assets/scripts/common/cmpt/)
- 虚拟列表VirtualList
- ......
#### 常用工具类
项目路径(assets/scripts/common/util/)
#### 对引擎源码的hack
项目路径(assets/scripts/common/hack/)
#### 几个shader

## <a id="showcase"></a>范例
https://leeyip.github.io/cocos-framework/