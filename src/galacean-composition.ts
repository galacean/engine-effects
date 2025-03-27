import type * as ENGINE from '@galacean/engine';
import type * as EFFECTS from '@galacean/effects-core';
import type { Scene, MeshRendererOptions, CompositionProps } from '@galacean/effects-core';
import { Composition, CompositionComponent, RendererComponent } from '@galacean/effects-core';
import type { GalaceanRenderer } from './galacean-renderer';
import { GalaceanTexture } from './galacean-texture';
import type { GalaceanEngine } from './galacean-engine';

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

  override prepareRender (): void {
    const render = this.renderer;
    const frame = this.renderFrame;

    frame._renderPasses[0].meshes.length = 0;

    // 主合成元素
    for (const vfxItem of this.rootComposition.items) {
      const rendererComponents = vfxItem.getComponents(RendererComponent);

      for (const rendererComponent of rendererComponents) {
        if (rendererComponent.isActiveAndEnabled) {
          rendererComponent.render(render);
        }
      }
    }
    // 预合成元素
    for (const refContent of this.refContent) {
      for (const vfxItem of refContent.getComponent(CompositionComponent).items) {
        const rendererComponents = vfxItem.getComponents(RendererComponent);

        for (const rendererComponent of rendererComponents) {
          if (rendererComponent.isActiveAndEnabled) {
            rendererComponent.render(render);
          }
        }
      }
    }
  }

}
