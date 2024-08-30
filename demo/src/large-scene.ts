import { OrbitControl } from '@galacean/engine-toolkit-controls';
import type { AmbientLight, GLTFResource } from '@galacean/engine';
import { Animator, AssetType, BackgroundMode, Camera, PrimitiveMesh, SkyBoxMaterial, WebGLEngine, WebGLMode } from '@galacean/engine';
import { GalaceanDisplayComponent } from '@galacean/engine-effects';
import '@galacean/engine-effects/plugin-spine';

import inspireList from './assets/inspire-list';

const jsons: [url: string, pos: number[], scale?: number, billboard?: boolean][] = [
  [inspireList.multiPeople.url, [0, 5, -7]],
  [inspireList.heart.url, [-6, 4, -2]],
  [inspireList.redpackRain.url, [0, 5, -10]],
  [inspireList.book.url, [0, 75, 0], 10, true],
  [inspireList.WuFu1.url, [-15, 5, -2], 1, true],
  [inspireList.applaud.url, [0, 6, 3]],
  [inspireList.whiteBlue2.url, [3, 0, -2]],
  ['https://mdn.alipayobjects.com/mars/afts/file/A*e2PBQa_gAwcAAAAAAAAAAAAADlB4AQ', [0, 3, -2], 1, true],
  ['https://mdn.alipayobjects.com/mars/afts/file/A*wvHEQ7NCai8AAAAAAAAAAAAADlB4AQ', [0, 3, 0], 1],
  ['https://mdn.alipayobjects.com/mars/afts/file/A*ger1RL7iTAoAAAAAAAAAAAAADlB4AQ', [6, 4, 3], 0.3],
];

void WebGLEngine
  .create({ canvas: 'J-canvas', graphicDeviceOptions: { webGLMode: WebGLMode.WebGL2 } })
  .then(async engine => {
    engine.canvas.resizeByClientSize();
    const rootEntity = engine.sceneManager.activeScene.createRootEntity();
    const cameraEntity = rootEntity.createChild('camera');
    const camera = cameraEntity.addComponent(Camera);

    camera.fieldOfView = 60;
    camera.nearClipPlane = 0.1;
    camera.farClipPlane = 1000;

    camera.enableFrustumCulling = false;
    cameraEntity.transform.setPosition(5, 5, 10);
    cameraEntity.addComponent(OrbitControl);

    // 1. 加载场景
    const gltf = await engine.resourceManager.load<GLTFResource>('https://mdn.alipayobjects.com/huamei_s9rwo4/afts/file/A*YgNkS4JVkboAAAAAAAAAAAAADiqKAQ/spacestation_scene_ld.glb');
    // 1.1 获取动画组件
    const { defaultSceneRoot } = gltf;
    const animator = defaultSceneRoot.getComponent(Animator);

    rootEntity.addChild(defaultSceneRoot);
    // 1.2 播放动画
    animator?.play('Take 01');

    // 2. Create sky
    await createSkyBox(engine);

    // 3. 实例化 DisplayComponent，并添加到主场景中
    await Promise.all(jsons.map(async ([url, pos, scale = 1, billboard = false]) => {
      const entity = rootEntity.createChild();
      const displayComponent = entity.addComponent(GalaceanDisplayComponent);

      // @ts-expect-error
      displayComponent.initialize(engine._hardwareRenderer.gl, { camera });
      await displayComponent.loadScene(url, { billboard });

      // 修改 Effects 位置
      displayComponent.entity.transform.setPosition(pos[0], pos[1], pos[2]);
      displayComponent.entity.transform.setScale(scale, scale, scale);
    }));

    // 4. 运行
    engine.run();
  });

async function createSkyBox (engine: WebGLEngine) {
  const ambientLight = await engine.resourceManager.load<AmbientLight>({
    type: AssetType.Env,
    url: 'https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin',
  });
  const scene = engine.sceneManager.activeScene;
  const sky = scene.background.sky;
  const skyMaterial = new SkyBoxMaterial(engine);

  scene.background.mode = BackgroundMode.Sky;
  sky.material = skyMaterial;
  sky.mesh = PrimitiveMesh.createCuboid(engine, 1, 1, 1);
  scene.ambientLight = ambientLight;
  skyMaterial.texture = ambientLight.specularTexture;
  skyMaterial.textureDecodeRGBM = true;
}

