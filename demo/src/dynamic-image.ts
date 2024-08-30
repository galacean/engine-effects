import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';

// 教师节贺卡
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*4AcqRZkGmz8AAAAAAAAAAAAADlB4AQ';
const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');

(async () => {
  try {
    // 1. Galacean 场景初始化
    const engine = await WebGLEngine.create({ canvas, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL1 } });
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
    await displayComponent.loadScene(json, {
      variables: {
        // 动态图片，支持传入图片地址或地址数组
        background: 'https://mdn.alipayobjects.com/huamei_klifp9/afts/img/A*ySrfRJvfvfQAAAAAAAAAAAAADvV6AQ/original',
      },
    });

    // 3. 执行 Galacean 渲染
    engine.run();
  } catch (e) {
    console.error('biz', e);
  }
})();
