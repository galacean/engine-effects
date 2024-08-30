import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import { Camera, Logger, WebGLEngine, WebGLMode } from '@galacean/engine';

const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');
// const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*OEyVTIysJHMAAAAAAAAAAAAADlB4AQ';
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*2rNdR76aFvMAAAAAAAAAAAAADlB4AQ';

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

    Logger.isEnabled = true;

    // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
    const entity = rootEntity.createChild();
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);

    const composition = await displayComponent.loadScene(json);
    const item = composition.getItemByName('lotteryBtn');

    displayComponent.interactive = true;

    displayComponent.on('click', e => {
      console.info(`[DisplayComponent click] - item [${e.name}] clicked.`);
    });

    displayComponent.on('message', e => {
      console.info(`[DisplayComponent message] - item [${e.name}] trigger message, type [${e.phrase}].`);
    });

    composition.on('end', ({ composition }) => {
      console.info(`[Composition end] - [${composition.name}] end.`);
    });

    item?.on('click', e => {
      console.info(`[item click] - item [${e.name}] clicked.`);
    });

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
