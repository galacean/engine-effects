import type { TouchEventType } from '@galacean/engine-effects';
import { GalaceanDisplayComponent, EventSystem, EVENT_TYPE_CLICK, spec } from '@galacean/engine-effects';
import type { Entity } from '@galacean/engine';
import { Camera, WebGLEngine, WebGLMode } from '@galacean/engine';

export async function createGalaceanPlayer (options: any) {
  const { container, renderFramework = 'webgl2', interactive } = options;
  const canvas = document.createElement('canvas');

  canvas.className = container.className;
  container.appendChild(canvas);

  const engine = await WebGLEngine.create({
    canvas,
    graphicDeviceOptions: {
      webGLMode: renderFramework === 'webgl' ? WebGLMode.WebGL1 : WebGLMode.WebGL2,
    },
  });

  engine.canvas.resizeByClientSize();

  const rootEntity = engine.sceneManager.activeScene.createRootEntity();
  const cameraEntity = rootEntity.createChild('camera');
  const camera = cameraEntity.addComponent(Camera);

  camera.fieldOfView = 60;
  camera.nearClipPlane = 0.1;
  camera.farClipPlane = 1000;
  camera.enableFrustumCulling = false;
  cameraEntity.transform.setPosition(0, 0, 8);
  engine.sceneManager.activeScene.background.solidColor.set(0, 0, 0, 1);

  return {
    engine,
    rootEntity,
    camera: !options.useEffectsCamera ? camera : undefined,
    hasPlayable: false,
    interactive,
    pause: () => { },
    resume: () => { },
    onItemClicked: (e: any) => {
      console.debug(`item ${e.name} has been clicked`);
    },
  };
}

let sceneName = '';
let displayComponent: GalaceanDisplayComponent;
let entity: Entity;

export async function renderByGalaceanDisplayComponent (player: any, json: string) {
  const { rootEntity, engine, camera, interactive = false } = player;

  engine.pause();

  if (entity) {
    entity.destroy();
  }
  let event;

  entity = (rootEntity as Entity).createChild();

  displayComponent = entity.addComponent(GalaceanDisplayComponent);
  displayComponent.initialize(engine._hardwareRenderer.gl, { camera });
  displayComponent.interactive = interactive;
  const scene = await displayComponent.loadScene(json);

  scene.on('end', ({ composition }) => {
    console.info(`${composition.name} end.`);
  });

  const currentComposition = displayComponent.compositions[0];

  // 防止 event 重复创建
  if (currentComposition.name !== sceneName) {
    // 注册事件系统 不需要响应点击时可以不进行注册
    event = new EventSystem(engine._hardwareRenderer._webCanvas);

    event.bindListeners();
    event.addEventListener(EVENT_TYPE_CLICK, handleClick);
    // @ts-expect-error
    currentComposition.event = event;
  }
  sceneName = currentComposition.name;

  function handleClick (e: TouchEventType) {
    const { x, y } = e;
    const regions = currentComposition.hitTest(x, y);

    if (regions.length) {
      for (let i = 0; i < regions.length; i++) {
        const { name, behavior = spec.InteractBehavior.NOTIFY } = regions[i];

        if (behavior === spec.InteractBehavior.NOTIFY) {
          // 或者自定义notify的回调参数
          console.info(`item ${name} has been clicked`);
        } else if (behavior === spec.InteractBehavior.RESUME_PLAYER) {
          player.resume();
        }
      }
    }
  }

  player.hasPlayable = true;
  player.pause = () => {
    displayComponent.pause();
  };
  player.resume = () => {
    void displayComponent.resume();
  };

  engine.run();
}
