import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import { Camera, WebGLEngine } from '@galacean/engine';

const jsons = [
  'https://mdn.alipayobjects.com/mars/afts/file/A*Xs_jSZVF0uQAAAAAAAAAAAAADlB4AQ', // ship
  'https://mdn.alipayobjects.com/mars/afts/file/A*qW9XQrKm4RAAAAAAAAAAAAAADlB4AQ',
  'https://mdn.alipayobjects.com/mars/afts/file/A*HPKjQJ2RAfAAAAAAAAAAAAAADlB4AQ',
  'https://mdn.alipayobjects.com/mars/afts/file/A*1LmgTaVdB38AAAAAAAAAAAAADlB4AQ', // star start
  'https://mdn.alipayobjects.com/mars/afts/file/A*HpGeQapHLn0AAAAAAAAAAAAADlB4AQ',
  'https://mdn.alipayobjects.com/mars/afts/file/A*wMDtT4lz5cUAAAAAAAAAAAAADlB4AQ', // star end
];
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
    const displayComponent = entity.addComponent(GalaceanDisplayComponent);

    // @ts-expect-error
    displayComponent.initialize(engine._hardwareRenderer.gl);
    // 加载 compositions
    const compositions = await Promise.all(jsons.map(json => displayComponent.loadScene(json)));

    compositions.forEach(composition => {
      composition.on('end', e => {
        console.info(`composition ${e.composition.name} end.`);
      });
    });

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
