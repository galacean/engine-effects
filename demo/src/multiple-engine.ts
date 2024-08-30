import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';
import type { Composition } from '@galacean/engine-effects';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

const json1 = 'https://mdn.alipayobjects.com/mars/afts/file/A*1FxpRKUFeMkAAAAAAAAAAAAADlB4AQ';
const json2 = 'https://mdn.alipayobjects.com/mars/afts/file/A*02UWQ6BvLuAAAAAAAAAAAAAADlB4AQ';
const canvas1 = document.getElementById('J-canvas1') as HTMLCanvasElement;
const canvas2 = document.getElementById('J-canvas2') as HTMLCanvasElement;

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine1 = await WebGLEngine.create({ canvas: canvas1 });
    const rootEntity1 = engine1.sceneManager.activeScene.createRootEntity();
    const cameraEntity1 = rootEntity1.createChild('camera');

    const engine2 = await WebGLEngine.create({ canvas: canvas2, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL1 } });
    const rootEntity2 = engine2.sceneManager.activeScene.createRootEntity();
    const cameraEntity2 = rootEntity2.createChild('camera');
    const camera1 = cameraEntity1.addComponent(Camera);
    const camera2 = cameraEntity2.addComponent(Camera);

    engine1.canvas.resizeByClientSize();
    engine2.canvas.resizeByClientSize();
    cameraEntity1.transform.setPosition(0, 0, 10);
    cameraEntity2.transform.setPosition(0, 0, 30);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity1 = rootEntity1.createChild();
    const displayComponent1 = entity1.addComponent(GalaceanDisplayComponent);
    const entity2 = rootEntity2.createChild();
    const displayComponent2 = entity2.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent1.initialize(engine1._hardwareRenderer.gl, { camera: camera1 });
    await displayComponent1.loadScene(json1);

    // @ts-expect-error
    displayComponent2.initialize(engine2._hardwareRenderer.gl, { camera: camera2 });
    await displayComponent2.loadScene(json2) as Composition;

    // 3. 执行 Galacean 渲染
    engine1.run();
    engine2.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
