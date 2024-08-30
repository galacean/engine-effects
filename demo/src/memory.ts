import { Camera, WebGLEngine } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import '@galacean/engine-effects/plugin-spine';

const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*5YkqQr81SFYAAAAAAAAAAAAADlB4AQ';
const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine = await WebGLEngine.create({ canvas });
    const rootEntity = engine.sceneManager.activeScene.createRootEntity();
    const cameraEntity = rootEntity.createChild('camera');

    container?.appendChild(canvas);
    engine.canvas.resizeByClientSize();

    cameraEntity.addComponent(Camera);
    cameraEntity.transform.setPosition(0, 0, 10);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);
    await displayComponent.loadScene(json);

    let t: number;

    setTimeout(async () => {
      t = setInterval(async () => {
        displayComponent.dispose();
        await displayComponent.loadScene(json);
      }, 3000);
    }, 10000);

    setTimeout(() => {
      displayComponent.destroy();
      window.clearInterval(t);
    }, 40000);

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
