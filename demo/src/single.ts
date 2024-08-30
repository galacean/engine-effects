import { Camera, WebGLEngine } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');
// 图层
// const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*Y8FjQKKWjboAAAAAAAAAAAAADlB4AQ'
// 闪电球
// const json = 'https://gw.alipayobjects.com/os/gltf-asset/mars-cli/NKICJVAEIWDU/-1916559527-63956.json';
// 爱心
// const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*02UWQ6BvLuAAAAAAAAAAAAAADlB4AQ';
// 场景推进
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*MVjVR79EnZgAAAAAAAAAAAAADlB4AQ';
// const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*8m6aSa2wW5IAAAAAAAAAAAAADlB4AQ';

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
    const composition = await displayComponent.loadScene(json, { autoplay: false });

    composition.on('end', ({ composition }) => {
      console.info(`${composition.name} end.`);
    });
    displayComponent.play();

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
