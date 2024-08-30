import type { GLTFResource } from '@galacean/engine';
import { Camera, Layer, Logger, WebGLEngine, WebGLMode } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import { OrbitControl } from '@galacean/engine-toolkit-controls';
import '@galacean/engine-effects/plugin-spine';

const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*1FxpRKUFeMkAAAAAAAAAAAAADlB4AQ';
const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');

Logger.enable();

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine = await WebGLEngine.create({ canvas, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL2 } });
    const rootEntity = engine.sceneManager.activeScene.createRootEntity();
    const cameraEntity = rootEntity.createChild('camera');
    const camera = cameraEntity.addComponent(Camera);

    // 设置背景颜色
    engine.sceneManager.activeScene.background.solidColor.set(0, 0, 0, 1);
    container?.appendChild(canvas);
    engine.canvas.resizeByClientSize();

    camera.fieldOfView = 60;
    camera.nearClipPlane = 0.1;
    camera.farClipPlane = 1000;
    camera.enableFrustumCulling = false;
    cameraEntity.transform.setPosition(0, 0, 18);
    cameraEntity.addComponent(OrbitControl);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const gltf = await engine.resourceManager.load<GLTFResource>('https://mdn.alipayobjects.com/huamei_s9rwo4/afts/file/A*yM8OS7JZq_EAAAAAAAAAAAAADiqKAQ/AlphaBlendModeTest.glb');
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    entity.layer = Layer.Nothing;
    rootEntity.addChild(gltf.defaultSceneRoot);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);

    // 红包
    const composition1 = await displayComponent.loadScene(json, { billboard: true, autoplay: false });
    // 爱心
    const composition2 = await displayComponent.loadScene('https://mdn.alipayobjects.com/mars/afts/file/A*02UWQ6BvLuAAAAAAAAAAAAAADlB4AQ', { billboard: true });
    // 蝴蝶
    const composition3 = await displayComponent.loadScene('https://mdn.alipayobjects.com/mars/afts/file/A*wvHEQ7NCai8AAAAAAAAAAAAADlB4AQ', { billboard: true });

    composition1.setPosition(5, 0, -10);
    composition2.setPosition(-2, 0, -2);
    composition3.setPosition(0, -3, -5);

    setTimeout(() => {
      composition1.play();
    }, 1500);

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
