import { Camera, WebGLEngine } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import inspireList from './assets/inspire-list';

const json1 = 'https://mdn.alipayobjects.com/mars/afts/file/A*OEyVTIysJHMAAAAAAAAAAAAADlB4AQ';
const json2 = inspireList.autumn.url;
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
    cameraEntity.transform.setPosition(0, 0, 8);

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const displayComponent1 = entity.addComponent(GalaceanDisplayComponent);
    const displayComponent2 = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent1.initialize(engine._hardwareRenderer.gl);
    await displayComponent1.loadScene(json1);
    // @ts-expect-error
    displayComponent2.initialize(engine._hardwareRenderer.gl);
    await displayComponent2.loadScene(json2);

    displayComponent1.interactive = true;
    displayComponent1.on('click', e => {
      console.info(`${e.name} clicked.`);
    });

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
