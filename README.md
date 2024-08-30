# Galacean Engine Effects

在 Galacean 环境下加载并渲染 Effects 动效

## 使用步骤

### 1、安装依赖

``` bash
$ npm i @galacean/engine --save
# 安装 Galacean 的 Effects 组件
$ npm i @galacean/engine-effects --save
```

### 1、Galacean 场景初始化

在 Galacean 中实现 Effects 首先要创建一个 Galacean 场景（如果你没有创建 Engine 对象的话）：

``` ts
import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';

// 创建一个 canvas
const canvas = document.createElement('canvas');
// 创建一个 engine 对象，WebGL 版本可选
const engine = await WebGLEngine.create({ canvas, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL2 } });
const rootEntity = engine.sceneManager.activeScene.createRootEntity();
const cameraEntity = rootEntity.createChild('camera');
// 创建一个相机对象
const camera = cameraEntity.addComponent(Camera);

engine.canvas.resizeByClientSize();

camera.fieldOfView = 60;
camera.nearClipPlane = 0.1;
camera.farClipPlane = 1000;

camera.enableFrustumCulling = false;
cameraEntity.transform.setPosition(0, 0, 8);
```

### 2、实例化 GalaceanDisplayComponent 并加载 Effects 资源

#### Effects 在 Galacean Engine 场景中渲染（使用场景如氛围粒子等）

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 创建一个空的 Entity 对象
const entity = rootEntity.createChild();
const displayComponent = entity.addComponent(GalaceanDisplayComponent);

// 初始化时把当前 engine 中的相机传递过去
displayComponent.initialize(engine._hardwareRenderer.gl, { camera });
// 加载 Effects 的资源
const scene = await displayComponent.loadScene('./xxx.json');
scene.setPosition(0,3,0);
```

#### Effects 和编辑器渲染效果同步（使用场景如弹窗、UI 层组件等）

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 创建一个空的 Entity 对象
const entity = rootEntity.createChild();
const displayComponent = entity.addComponent(GalaceanDisplayComponent);

// 初始化不传入 Galacean 相机则默认使用Effects自带相机和编辑器保持同步
displayComponent.initialize(engine._hardwareRenderer.gl);
// 加载 Effects 的资源
const scene = await displayComponent.loadScene('./xxx.json');

// 调整平移
scene.setPosition(0,3,0);
```

> Tips
>
> - 如果你想创建多个 Effects 只需要重复上述步骤就可以了
> - 单独暂停 Effects：`displayComponent.pause();`
> - 单独继续播放 Effects：`displayComponent.resume();`
> - 单独销毁操作：在渲染 Effects 中不需要用户关心 Effects 的销毁，如果想强行销毁 Effects 请调用 `displayComponent.dispose(name?)`，其中 `name` 参数可选，销毁指定的 composition，默认全部销毁

### 3、执行 Galacean 渲染

``` ts
// 当然你也可以先执行渲染，再实例化 Effects
engine.run();
```

## 高级用法

### 数据模版支持

下面给出如何使用 Effects 中的数据模板：

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 创建一个空的 Entity 对象
const entity = rootEntity.createChild();
const displayComponent = entity.addComponent(GalaceanDisplayComponent);

// 初始化时把当前 engine 中的相机传递过去
displayComponent.initialize(engine._hardwareRenderer.gl, { camera });
// 加载 Effects 的资源
const scene = await displayComponent.loadScene('./xxx.json', {
  variables: {
    // 动态图片，支持传入图片地址或地址数组
    background: 'https://xxx.png', // 如果图片加载失败，将会触发加载失败
    image_avatar: ['https://xxx.png', 'https://xxx.png'], // 如果第一个加载失败，将尝试使用第二个地址，都失败将会触发加载失败
  },
});
```

和直接在 `effects-runtime` 中的使用类似，更多使用方法参考 Effects 的开发者文档：<https://galacean.antgroup.com/effects/user/oyvu6mxzo4n860me>

### 多 DisplayComponent 的播放（不推荐）

在 `engine-effects` 中允许创建多个 `DisplayComponent`，多个 `DisplayComponent` 也是可以一起播放 Effects 的，下面给出多个 `DisplayComponent` 如何一起播放 Effects：

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-Effects';

// 创建一个空的 Entity 对象
const entity0 = rootEntity.createChild();
const displayComponent0 = entity.addComponent(GalaceanDisplayComponent);

// 初始化不传入 Galacean 相机则默认使用Effects自带相机和编辑器保持同步
displayComponent0.initialize(engine._hardwareRenderer.gl);
// 加载 Effects 的资源
const scene0 = await displayComponent0.loadScene('./xxx.json');

// RTS 调用
// 以第一个合成为例
const transform = displayComponent0.compositions[0].rootTransform;
// 调整平移
transform.position[1] = 5; // transform.setPosition(0,5,0);
// 调整旋转
transform.setRotation(90,0,0);
// 调整缩放
transform.scale[0] = 2; // transform.setScale(2,1,1);

// 播放 Effects 资源
await displayComponent0.play(scene0);

const entity1 = rootEntity.createChild();
const displayComponent1 = entity.addComponent(GalaceanDisplayComponent);

// 初始化不传入 Galacean 相机则默认使用Effects自带相机和编辑器保持同步
displayComponent1.initialize(engine._hardwareRenderer.gl);
// 加载 Effects 的资源
const scene1 = await displayComponent.loadScene('./xxx.json');

// 播放 Effects 资源,这样 displayComponent1 中的 Effects 都会置于 displayComponent0 的上层
await displayComponent1.play(scene, { componentRenderOrder:2 });
```

### 多合成播放

下面给出如何使用 Effects 中的多合成播放：

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 创建一个空的 Entity 对象
const entity = rootEntity.createChild();
const displayComponent = entity.addComponent(GalaceanDisplayComponent);
const json = [
  './xxx.json',
  './xxx.json',
  './xxx.json',
]

// 初始化时把当前 engine 中的相机传递过去
displayComponent.initialize(engine._hardwareRenderer.gl, { camera });

// 加载compositions
const compositions = await Promise.all(json.map(json => displayComponent.loadScene(json)));
```

### 交互元素

开发和设计约定好交互元素名称后，便可以通过交互回调来监听渲染中的交互元素了，下面给出如何使用 Effects 中的交互元素：

``` ts
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 创建一个空的 Entity 对象
const entity = rootEntity.createChild();
const displayComponent = entity.addComponent(GalaceanDisplayComponent);

// 初始化时把当前 engine 中的相机传递过去
displayComponent.initialize(engine._hardwareRenderer.gl, { camera });
// 加载 effects 的资源
const composition = await displayComponent.loadScene('./xxx.json');

displayComponent.on('message', e => {
  console.log(e.name); //设置多个交互元素需要根据 name 判断是否指定元素
  if (e.phrase === spec.MESSAGE_ITEM_PHRASE_BEGIN) {
    // 元素创建
  } else if (e.phrase === spec.MESSAGE_ITEM_PHRASE_END) {
    // 元素销毁
  }
});

displayComponent.interactive = true;
displayComponent.on('click', e => {
  // 设置多个元素的点击交互需要根据 name 判断是否指定元素
  console.log('trigger click.')
  console.log(e.name);
});
```

和直接在 EffectsPlayer 中的使用类似，更多使用方法参考 Effects 的开发者文档：<https://yuque.antfin.com/huoxing/knaszl/us047ue7mef3k08a>

### Spine 插件

``` ts
// 引入 spine 插件
// ES Module
import '@galacean/engine-effects/plugin-spine';
// 非 ES Module
import '@galacean/engine-effects/dist/plugin-spine';
```

## 注意事项

### 蒙版问题

默认背景颜色下，蒙版可能会和编辑器上不一致，如果想要和编辑器中效果一致的话，请调整背景颜色为黑色，代码如下：

``` ts
// 设置背景颜色
engine.sceneManager.activeScene.background.solidColor.set(0, 0, 0, 1);
```

## API 文档

``` bash
$ pnpm build:docs
// 生成的 api 目录
```

## 开发

### 环境准备

- Node.js `>= 16.0.0`
- [Pnpm](https://pnpm.io/)  `latest`
  - 安装：
    - `npm install -g pnpm`
  - 升级：
    - `pnpm install -g pnpm`

### 本地开发

#### 开始开发

``` bash
# 1. 安装依赖（首次）
pnpm install
# 2. demo
pnpm dev
```

> 浏览器打开：<http://localhost:8080/demo/>

### 低端设备测试

``` bash
# demo 的 legacy 版本
pnpm preview
```
