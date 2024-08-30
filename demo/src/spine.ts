import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import '@galacean/engine-effects/plugin-spine';

const container = document.getElementById('J-container');
const canvas = document.createElement('canvas');
const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*C_h3QaPSnfYAAAAAAAAAAAAADlB4AQ';
// 仅蝴蝶
// const json = 'https://mdn.alipayobjects.com/mars/afts/file/A*wvHEQ7NCai8AAAAAAAAAAAAADlB4AQ';

(async () => {
  // 1. Galacean 场景初始化
  const engine = await WebGLEngine.create({ canvas, graphicDeviceOptions: { webGLMode: WebGLMode.WebGL2 } });
  const rootEntity = engine.sceneManager.activeScene.createRootEntity();
  const cameraEntity = rootEntity.createChild('camera');
  const camera = cameraEntity.addComponent(Camera);

  container?.appendChild(canvas);
  engine.canvas.resizeByClientSize();
  camera.fieldOfView = 60;
  camera.nearClipPlane = 0.1;
  camera.farClipPlane = 1000;
  camera.enableFrustumCulling = false;
  cameraEntity.transform.setPosition(0, 0, 10);

  // 2. 实例化 GalaceanDisplayComponent 并加载 Effects 资源
  const entity = rootEntity.createChild();
  const displayComponent = entity.addComponent(GalaceanDisplayComponent);

  // @ts-expect-error
  displayComponent.initialize(engine._hardwareRenderer.gl);
  await displayComponent.loadScene(json);

  // 3. 执行 Galacean 渲染
  engine.run();
})();
