import type * as ENGINE from '@galacean/engine';
import type * as EFFECTS from '@galacean/effects-core';
import type { Scene, MeshRendererOptions, CompositionProps } from '@galacean/effects-core';
import { Composition } from '@galacean/effects-core';
import type { GalaceanRenderer } from './galacean-renderer';
import { GalaceanTexture } from './galacean-texture';
import type { GalaceanEngine } from './galacean-engine';
import { GalaceanRenderFrame } from './galacean-render-frame';

export interface GalaceanCompositionProps extends CompositionProps {
  /**
   * 指定合成名字
   */
  compositionName?: string,
  /**
   * 是否多合成
   */
  multipleCompositions?: boolean,
  /**
   * 相机参数
   */
  galaceanCamera?: ENGINE.Camera,
  /**
   * 是否始终朝向相机
   * @since 1.3.0
   */
  billboard?: boolean,
}

/**
 * composition 抽象类的实现
 */
export class GalaceanComposition extends Composition {
  /**
   * 发射器形状缓存 map
   */
  static shape: Record<string, number> = {};

  /**
   * composition 开始标志
   */
  started = false;
  /**
   * 相机参数
   */
  galaceanCamera?: ENGINE.Camera;
  engine?: EFFECTS.Engine;
  /**
   * 是否始终朝向相机
   * @since 1.3.0
   */
  billboard = false;

  constructor (props: GalaceanCompositionProps, scene: Scene) {
    super(props, scene);

    const { billboard, galaceanCamera } = props;

    this.billboard = !!billboard;
    this.compositionSourceManager.sourceContent?.items.forEach(item => {
      // @ts-expect-error
      const shape = item.content?.renderer?.shape ?? {};

      Object.keys(shape).forEach(name => {
        const buffer = shape[name];

        if (!GalaceanComposition.shape[name]) {
          GalaceanComposition.shape[name] = 0;
        }
        GalaceanComposition.shape[name] += buffer.length;
      });
    });
    this.galaceanCamera = galaceanCamera;
    this.engine = this.renderer.engine;
    (this.renderer as GalaceanRenderer).setEffectsCamera(this.camera);
  }

  /**
   * 更新 video texture 数据
   */
  override updateVideo () {
    void this.textures.map(tex => (tex as GalaceanTexture).startVideo());
  }

  override setPosition (x: number, y: number, z: number): void {
    (this.renderer.engine as GalaceanEngine).entity.transform.setPosition(x, y, z);
  }

  /**
   * 开始
   */
  override createRenderFrame () {
    this.renderFrame = new GalaceanRenderFrame({
      camera: this.camera,
      keepColorBuffer: this.keepColorBuffer,
      renderer: this.renderer,
    });
  }

  /**
   * 获取 render 参数
   *
   * @returns
   */
  override getRendererOptions (): MeshRendererOptions {
    const emptyTexture = GalaceanTexture.createWithData(
      this.renderer.engine,
      {
        data: new Uint8Array(4).fill(255),
        width: 1,
        height: 1,
      },
    );

    if (!this.rendererOptions) {
      this.rendererOptions = {
        emptyTexture,
        cachePrefix: '-',
      };
    }

    return this.rendererOptions;
  }

  override prepareRender () {
    const frame = this.renderFrame;

    frame._renderPasses[0].meshes.length = 0;
    this.postLoaders.length = 0;
    this.pluginSystem.plugins.forEach(loader => {
      if (loader.prepareRenderFrame(this, frame)) {
        this.postLoaders.push(loader);
      }
    });
    this.gatherRendererComponent(this.rootItem, frame);
    this.postLoaders.forEach(loader => loader.postProcessFrame(this, frame));
  }
}
