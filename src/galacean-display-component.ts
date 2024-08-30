import * as ENGINE from '@galacean/engine';
import type {
  JSONValue, Scene, SceneLoadOptions, TouchEventType, EffectsObject, MessageItem,
  Renderer, SceneType, Composition, SceneLoadType, EventEmitterListener, Region,
} from '@galacean/effects-core';
import {
  EVENT_TYPE_CLICK, EventSystem, spec, AssetManager, Ticker, isArray, gpuTimer, isSceneURL,
  isSceneWithOptions, Texture, logger,
} from '@galacean/effects-core';
import { GalaceanComposition } from './galacean-composition';
import { GalaceanRenderer } from './galacean-renderer';
import { GalaceanEngine } from './galacean-engine';

/**
 * 播放器可以绑定的事件
 */
export type PlayerEvent<P> = {
  /**
   * 播放器点击事件
   */
  ['click']: [clickInfo: Region & {
    player: P,
    compositionId: string,
    compositionName: string,
  }],
  /**
   * 播放器消息事件（合成中元素创建/销毁时触发）
   */
  ['message']: [messageInfo: MessageItem],
  /**
   * 播放器暂停事件
   */
  ['pause']: [],
  /**
   * 播放器更新事件
   */
  ['update']: [updateInfo: { player: P, playing: boolean }],
  /**
   * 渲染错误事件
   */
  ['rendererror']: [error?: Error],
};

/**
 * `onItemClicked` 点击回调函数的传入参数
 */
export interface ItemClickedData {
  name: string,
  id: number,
  displayComponent: GalaceanDisplayComponent,
  hitPositions: spec.vec3[],
  compositionId: number,
}

/**
 * `displayComponent.play` 的可选参数
 */
export interface PlayOptions {
  /**
   * 播放开始时间
   * @default 0
   */
  currentTime?: number,
  /**
   * 播放第一帧后暂停播放器
   */
  pauseOnFirstFrame?: boolean,
  /**
   * 合成播放完成后是否需要再使用，是的话生命周期结束后不会 `dispose`
   * @default false
   */
  reusable?: boolean,
  /**
   * 播放速度，当速度为负数时，合成倒播
   */
  speed?: number,
  /**
   * 是否为多合成播放
   * @default false - 会替换当前播放的合成
   */
  multipleCompositions?: boolean,
  /**
   * 多合成播放时的基础渲染顺序，数字小的先渲染
   */
  baseRenderOrder?: number,
  /**
   * 多合成播放时的基础渲染顺序，数字小的先渲染，默认多个 component 的 Effects 混合在一起渲染
   * @since 2.0.0
   */
  componentRenderOrder?: number,
  /**
   * 如果动画配置有多个合成，设置要播放的合成名称
   */
  compositionName?: string,
}
/**
 * Effects 组件全局参数
 */
export interface GalaceanDisplayComponentOptions {
  // 宽度
  width?: number,
  // 高度
  height?: number,
  // 相机对象
  camera?: ENGINE.Camera,
  // 是否可交互（仅在使用默认相机时生效，即camera参数为空）
  interactive?: boolean,
}

/**
 * Effects 全局参数
 */
export interface GalaceanEffectsOptions {
  /**
   * 是否通知 container touchend / mouseup 事件, 默认通知
   */
  notifyTouch?: boolean,
}

export interface GalaceanSceneLoadOptions extends SceneLoadOptions {
  /**
   * 是否始终朝向相机
   * @since 1.3.0
   */
  billboard?: boolean,
  /**
   * 合成的层级
   * @since 2.0.0 - 用于多个合成同时播放时的渲染顺序
   */
  priority?: number,
}

/**
 *
 */
export class GalaceanDisplayComponent extends ENGINE.Script {
  static notifyTouch: boolean;

  compositions: GalaceanComposition[] = [];
  camera?: ENGINE.Camera;
  width: number;
  height: number;
  event: EventSystem;
  renderer: Renderer;

  gl: WebGLRenderingContext | WebGL2RenderingContext;
  /**
   * GE 使用的计时器
   */
  ticker: Ticker | null;
  baseCompositionIndex: any;
  assetManagers: AssetManager[] = [];
  env: string;
  disposed: any;
  autoPlaying: boolean;
  effectsEngine: GalaceanEngine;
  speed = 1;

  private readonly builtinObjects: EffectsObject[] = [];
  private resumePending = false;

  /**
   * Effects 组件初始化方法
   * @param context - WebGL上下文
   * @param options - 组件参数
   */
  initialize (
    context: WebGLRenderingContext | WebGL2RenderingContext,
    options: GalaceanDisplayComponentOptions = {},
  ) {
    const { width, height } = this.engine.canvas;
    const { camera, interactive = false } = options;

    // @ts-expect-error _webCanvas 为私有属性
    this.event = new EventSystem(this.engine.canvas._webCanvas, GalaceanDisplayComponent.notifyTouch);
    this.event.bindListeners();
    this.event.addEventListener(EVENT_TYPE_CLICK, this.handleClick);
    this.width = width;
    this.height = height;
    this.camera = camera;
    this.gl = context;
    this.effectsEngine = new GalaceanEngine(
      context,
      this.engine,
      {
        entity: this.entity,
        camera: this.camera,
      },
    );
    // 设置 Renderer
    this.renderer = new GalaceanRenderer(this.effectsEngine);
    // 交互元素需要 engine->renderer->env
    this.effectsEngine.renderer = this.renderer;
    this.ticker = new Ticker(60);
    this.interactive = interactive;
    const ticker = this.ticker;

    ticker.add(this.tick.bind(this));
    ticker.start();
  }

  /**
   * 元素监听事件
   * @param eventName - 事件名称
   * @param listener - 事件监听器
   * @returns
   */
  on<E extends keyof PlayerEvent<GalaceanDisplayComponent>> (
    eventName: E,
    listener: EventEmitterListener<PlayerEvent<GalaceanDisplayComponent>[E]>,
  ) {
    this._engine.on(eventName, listener);
  }

  /**
   * 移除事件监听器
   * @param eventName - 事件名称
   * @param listener - 事件监听器
   * @returns
   */
  off<E extends keyof PlayerEvent<GalaceanDisplayComponent>> (
    eventName: E,
    listener: EventEmitterListener<PlayerEvent<GalaceanDisplayComponent>[E]>,
  ) {
    this._engine.off(eventName, listener);
  }

  /**
   * 一次性监听事件
   * @param eventName - 事件名称
   * @param listener - 事件监听器
   */
  once<E extends keyof PlayerEvent<GalaceanDisplayComponent>> (
    eventName: E,
    listener: EventEmitterListener<PlayerEvent<GalaceanDisplayComponent>[E]>,
  ) {
    this._engine.once(eventName, listener);
  }

  /**
   * 触发事件
   * @param eventName - 事件名称
   * @param args - 事件参数
   */
  emit<E extends keyof PlayerEvent<GalaceanDisplayComponent>> (
    eventName: E,
    ...args: PlayerEvent<GalaceanDisplayComponent>[E]
  ) {
    this._engine.dispatch(eventName, ...args);
  }

  /**
   * display component 在定时器每帧的回调
   * @param dt - 时间差，毫秒
   */
  private tick (dt: number) {
    dt = Math.min(dt, 33) * this.speed;
    const comps = this.compositions;
    let skipRender = false;
    const { renderErrors } = this.renderer.engine;

    renderErrors.values().next().value;

    if (renderErrors.size > 0) {
      this.emit('rendererror', renderErrors.values().next().value);
      // 有渲染错误时暂停播放
      this.ticker?.pause();
    }
    comps.sort((a, b) => a.getIndex() - b.getIndex());
    this.compositions = [];
    for (let i = 0; i < comps.length; i++) {
      const composition = comps[i];

      if (composition.textureOffloaded) {
        skipRender = true;
        logger.error(`Composition ${composition.name} texture offloaded, skip render.`);
        this.compositions.push(composition);
        continue;
      }
      if (!composition.isDestroyed && composition.renderer) {
        composition.update(dt);
      }
      if (!composition.isDestroyed) {
        this.compositions.push(composition);
      }
    }
    this.baseCompositionIndex = this.compositions.length;
    if (skipRender) {
      this.emit('rendererror', new Error('Play when texture offloaded.'));

      return this.ticker?.pause();
    }
    if (!this.pause) {
      const { level } = this.effectsEngine.gpuCapability;
      const time = level === 2 ? gpuTimer(this.gl as WebGL2RenderingContext) : undefined;

      time?.begin();
      if (
        this.compositions.length ||
        this.compositions.length < comps.length
      ) {
        for (let i = 0; i < comps.length; i++) {
          !comps[i].renderFrame.isDestroyed && this.renderer.renderRenderFrame(comps[i].renderFrame);
        }
      }
      time?.end();
      time?.getTime()
        .then(t => this.reportGPUTime?.(t ?? 0))
        .catch;
      if (this.autoPlaying) {
        this.emit('update', {
          player: this,
          playing: true,
        });
      }
    }
  }

  reportGPUTime (arg0: number): any {
    throw new Error('Method not implemented.');
  }

  override onUpdate (deltaTime: number): void {
    this.lookAtCamera();
  }

  private lookAtCamera () {
    if (!this.camera) {
      return;
    }

    const position = this.camera.entity.transform.position;

    this.compositions.forEach(comp => {
      if (comp.billboard && comp.renderer.engine) {
        (comp.renderer.engine as GalaceanEngine).entity.transform.lookAt(position);
      }

    });
  }
  // TODO: 暂时先注释，如果所有galacean业务的诉求都是和设计帧率保持一致，该方法可删除
  // /**
  //  * Component 的每帧更新函数-
  //  * @param deltaTime 每帧更新时间
  //  * @returns
  //  */
  // override onUpdate (deltaTime: number) {

  //   if (this.paused) {
  //     return;
  //   }

  //   deltaTime = Math.max(deltaTime, 0.0167);
  //   const comps = this.compositions;

  //   comps.forEach((composition, i) => {

  //     if (!composition.started) {
  //       return;
  //     }
  //     if (composition.isDestroyed) {
  //       composition.dispose();
  //       delete comps[i];

  //       return;
  //     }
  //     const time = Math.round(deltaTime * 1000);

  //     this.compositions = comps;
  //     if (time) {
  //       const reverse = time < 0;
  //       const step = 15;
  //       let t = Math.abs(time);

  //       for (let ss = reverse ? -step : step; t > step; t -= step) {
  //         composition.update(ss);
  //       }
  //       if (t > 0 && !composition.isDestroyed) {
  //         const ss = reverse ? -t : t;

  //         composition.update(ss);
  //       }
  //     }
  //   });

  // }

  /**
   * 获取当前播放合成，如果是多个合成同时播放，返回第一个合成
   */
  get currentComposition (): GalaceanComposition {
    return this.compositions?.[0];
  }

  /**
   * 播放通过 player 加载好的全部合成
   */
  play () {
    this.autoPlaying = true;
    this.compositions.map(composition => {
      composition.play();
    });
    this.ticker?.start();
  }

  /**
   * 加载动画资源
   * @param scene - 一个或一组 URL 或者通过 URL 请求的 JSONObject 或者 Scene 对象
   * @param options - 加载可选参数
   * @returns
   */
  async loadScene (scene: SceneLoadType, options?: GalaceanSceneLoadOptions): Promise<GalaceanComposition>;
  async loadScene (scene: SceneLoadType[], options?: GalaceanSceneLoadOptions): Promise<GalaceanComposition[]>;
  async loadScene (scene: SceneLoadType | SceneLoadType[], options?: GalaceanSceneLoadOptions): Promise<GalaceanComposition | GalaceanComposition[]> {
    let composition: GalaceanComposition | GalaceanComposition[];
    const baseOrder = this.baseCompositionIndex;

    if (isArray(scene)) {
      this.baseCompositionIndex += scene.length;
      composition = await Promise.all(scene.map(async (scn, index) => {
        const res = await this.createComposition(scn, options);

        res.setIndex(baseOrder + index);

        return res;
      }));
    } else {
      this.baseCompositionIndex += 1;
      composition = await this.createComposition(scene, options);
      composition.setIndex(baseOrder);
    }

    this.ticker?.start();

    this.entity.addChild(((composition as GalaceanComposition).renderer.engine as GalaceanEngine).entity);

    return composition;
  }

  private async createComposition (
    url: SceneLoadType,
    options: GalaceanSceneLoadOptions = {},
  ): Promise<GalaceanComposition> {
    const engine = new GalaceanEngine(
      this.gl,
      this.engine,
      {
        entity: this.entity,
        camera: this.camera,
      },
    );

    engine.priority = options.priority ?? 0;
    engine.createEntity();

    const renderer = new GalaceanRenderer(engine);
    const last = performance.now();
    let opts = {
      autoplay: true,
      ...options,
    };
    let source: SceneType;

    engine.renderer = renderer;

    if (isSceneURL(url)) {
      source = url.url;
      if (isSceneWithOptions(url)) {
        opts = {
          ...opts,
          ...url.options,
        };
      }
    } else {
      source = url;
    }

    const assetManager = new AssetManager(opts);

    // TODO 多 json 之间目前不共用资源，如果后续需要多 json 共用，这边缓存机制需要额外处理
    // 在 assetManager.loadScene 前清除，避免 loadScene 创建的 EffectsObject 对象丢失
    engine.clearResources();
    this.assetManagers.push(assetManager);
    const scene = await assetManager.loadScene(source, renderer, { env: this.env });

    // 加入 json 资产数据
    engine.addPackageDatas(scene);
    // 加入内置引擎对象
    for (const effectsObject of this.builtinObjects) {
      engine.addInstance(effectsObject);
    }
    for (let i = 0; i < scene.textureOptions.length; i++) {
      scene.textureOptions[i] =
        scene.textureOptions[i] instanceof Texture
          ? scene.textureOptions[i]
          : engine.assetLoader.loadGUID(scene.textureOptions[i].id);
    }

    if (engine.database) {
      await engine.createVFXItems(scene);
    }

    // 加载期间 player 销毁
    if (this.disposed) {
      throw new Error('Disposed player can not used to create Composition.');
    }
    const composition = new GalaceanComposition({
      ...opts,
      renderer: renderer,
      width: this.engine.canvas.width,
      height: this.engine.canvas.height,
      event: this.event,
      handleItemMessage: (message: MessageItem) => {
        this.emit('message', message);
      },
    }, scene);

    // 中低端设备降帧到 30fps
    if (this.ticker) {
      if (opts.renderLevel === spec.RenderLevel.B) {
        this.ticker.setFPS(Math.min(this.ticker.getFPS(), 30));
      }
    }

    if (opts.autoplay) {
      this.autoPlaying = true;
      composition.play();
    } else {
      composition.pause();
    }

    const firstFrameTime = performance.now() - last + composition.statistic.loadTime;

    composition.statistic.firstFrameTime = firstFrameTime;
    logger.info(`first frame: [${composition.name}]${firstFrameTime.toFixed(4)}ms`);

    this.compositions.push(composition);

    return composition;
  }

  private handleClick = (e: TouchEventType) => {
    const { x, y } = e;

    this.compositions.forEach(composition => {
      if (!composition || !composition.loaderData) {
        return;
      }

      const regions = composition?.hitTest(x, y);

      if (regions && regions.length) {
        for (let i = 0; i < regions.length; i++) {
          const behavior = regions[i].behavior || spec.InteractBehavior.NOTIFY;

          if (behavior === spec.InteractBehavior.NOTIFY) {

            this.emit('click', {
              ...regions[i],
              compositionId: composition.id,
              compositionName: composition.name,
              player: this,
            });

            composition.emit('click', {
              ...regions[i],
              compositionId: composition.id,
              compositionName: composition.name,
            });
          } else if (behavior === spec.InteractBehavior.RESUME_PLAYER) {
            void this.resume();
          }
        }
      }
    });
  };

  /**
   * 快进/快退指定时间间隔
   * @param composition - 要快进的合成
   * @param timeInSeconds - 需要快进/快退的时间长度（秒），可正可负
   */
  forwardCompositionTime (composition: Composition, timeInSeconds: number) {
    if (timeInSeconds) {
      composition?.update(timeInSeconds * 1000);
    }
  }

  /**
   * 获取当前播放的所有合成（请不要修改返回的数组内容）
   */
  getCompositions () {
    return this.compositions;
  }

  /**
   * 异步加载动画资源
   * @param url - URL 或者通过 URL 请求的 JSONObject
   * @param options - 加载可选参数
   * @since 1.0.0
   * @returns
   */
  async loadAsset (
    url: string | JSONValue,
    options: GalaceanSceneLoadOptions = {},
  ): Promise<Scene> {
    const assetManager = new AssetManager(options);
    const scene = await assetManager.loadScene(url as SceneType);

    return scene;
  }

  /**
   * 播放器是否已暂停
   */
  get paused () {
    return this.ticker?.getPaused();
  }

  /**
   * 获取播放器是否可交互
   */
  get interactive () {
    return this.event.enabled;
  }

  /**
   * 设置播放器是否可交互
   */
  set interactive (enable) {
    this.event.enabled = enable;
  }

  /**
   * 跳转全部合成到指定时间后播放
   * @param time - 指定时间, 单位秒
   */
  gotoAndPlay (time: number) {
    this.autoPlaying = true;
    this.compositions.map(composition => {
      composition.gotoAndPlay(time);
    });
    if (this.ticker) {
      this.ticker.start();
    } else {
      this.tick(0);
    }
  }

  /**
   * 跳转全部合成到指定时间并停留
   * @param time - 指定时间, 单位秒
   */
  gotoAndStop (time: number) {
    this.autoPlaying = false;
    this.compositions.map(composition => {
      composition.gotoAndStop(time);
    });
    if (!this.ticker || this.ticker?.getPaused()) {
      this.tick(0);
    }
    this.emit('update', {
      player: this,
      playing: false,
    });
  }

  /**
   * 顺序播放一组还未开始播放的合成
   * @param compositions - 要播放的合成数组
   */
  playSequence (compositions: Composition[]): void {
    for (let i = 0; i < compositions.length - 1; i++) {
      compositions[i].on('end', () => {
        compositions[i + 1].play();
      });
    }
    compositions[0].play();
    this.ticker?.start();
  }

  /**
   * 暂停播放器
   * @param options
   * @param options.offloadTexture - 是否卸载贴图纹理，减少内存
   * @returns
   */
  pause (options?: { offloadTexture?: boolean }) {
    if (this.paused) {
      return;
    }

    this.ticker?.pause();
    this.emit('update', {
      player: this,
      playing: false,
    });
  }

  /**
   * 恢复播放器
   * > 如果暂停时卸载了纹理贴图，此函数将自动请求网络重新加载纹理
   * @returns
   */
  async resume () {
    if (this.resumePending) {
      return;
    }
    if (this.paused) {
      this.resumePending = true;
      await Promise.all(this.compositions.map(c => c.reloadTexture()));
      this.resumePending = false;
      this.handleResume();
    }
    this.ticker?.resume();
  }

  private handleResume = () => {
    this.emit('update', { player: this, playing: true });
  };

  /**
   * 根据名称查找对应的合成（可能找不到，如果有同名的合成，默认返回第一个）
   * @example
   * ``` ts
   * const composition = player.getCompositionByName('新建合成1');
   * ```
   * @param name - 目标合成名称
   */
  getCompositionByName (name: string) {
    return this.compositions.find(comp => comp.name === name);
  }

  /**
   * 销毁 composition
   */
  override onDestroy (): void {
    this.pause();
    this.ticker?.stop();
    this.ticker = null;
    this.event?.dispose();
    this.dispose();
  }

  /**
   * 销毁当前播放的所有 Composition
   */
  destroyCurrentCompositions () {
    this.compositions.forEach(comp => comp.dispose());
    this.compositions.length = 0;
    this.baseCompositionIndex = 0;
  }

  /**
   * Effects 的单独销毁方法
   * @param name - 指定的 `composition` 名称
   */
  dispose (name?: string) {
    if (!name) {
      this.pause();
      this.compositions.forEach(composition => {
        if (composition) {
          composition.dispose();
          composition.renderer.engine.dispose();
        }
      });
      this.compositions = [];
    } else {
      let comps = this.compositions;

      comps.forEach(async (comp, i) => {
        if (comp && comp.name === name) {
          this.pause();
          comp.dispose();
          comp.renderer.engine.dispose();
          delete comps[i];

          await this.resume();
        }
      });
      comps = comps.filter(comp => comp);
      this.compositions = comps;
    }
  }
}
