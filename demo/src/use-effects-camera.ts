import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';

const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*MVjVR79EnZgAAAAAAAAAAAAADlB4AQ';

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine = await WebGLEngine.create({ canvas, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL1 } });
    const rootEntity = engine.sceneManager.activeScene.createRootEntity();
    const cameraEntity = rootEntity.createChild('camera');

    container?.appendChild(canvas);
    engine.canvas.resizeByClientSize();

    cameraEntity.addComponent(Camera);
    cameraEntity.transform.setPosition(0, 0, 15);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);
    await displayComponent.loadScene(json);

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
