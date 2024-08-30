import { Camera, WebGLEngine } from '@galacean/engine';
import { GalaceanDisplayComponent, GalaceanTextComponent } from '@galacean/engine-effects';

const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*GpjhQKmxI1MAAAAAAAAAAAAADlB4AQ';

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine = await WebGLEngine.create({ canvas });
    const rootEntity = engine.sceneManager.activeScene.createRootEntity();
    const cameraEntity = rootEntity.createChild('camera');

    container?.appendChild(canvas);
    engine.canvas.resizeByClientSize();

    cameraEntity.addComponent(Camera);
    cameraEntity.transform.setPosition(0, 0, 18);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);
    const composition = await displayComponent.loadScene(json);

    const textItem = composition.getItemByName('text_2');
    const textComponent = textItem?.getComponent(GalaceanTextComponent);

    textComponent?.setTextColor([255, 0, 0, 1]);

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
