import * as ENGINE from '@galacean/engine';
import type {
  Texture2DSourceOptionsData, Texture2DSourceOptionsImage, Texture2DSourceOptionsVideo,
  TextureDataType, TextureSourceOptions, spec,
} from '@galacean/effects-core';
import { glContext, Texture, TextureSourceType, throwDestroyedError } from '@galacean/effects-core';
import type { GalaceanEngine } from './galacean-engine';

/**
 * Galacean 抽象纹理类
 */
export class GalaceanTexture extends Texture {
  /**
   * Engine 纹理对象
   */
  texture: ENGINE.Texture2D | null;

  video: HTMLVideoElement;

  override source: TextureSourceOptions = {};

  /**
   * 将 WebGL 纹理过滤器枚举类型映射到 Galacean 纹理过滤器枚举类型
   * @param filter - WebGL 纹理过滤器枚举类型
   * @returns Galacean 纹理过滤器枚举类型
   */
  static toGalaceanTextureFilter (filter?: GLenum): ENGINE.TextureFilterMode {
    switch (filter) {
      case glContext.LINEAR:
        return ENGINE.TextureFilterMode.Bilinear;
      default:
        return ENGINE.TextureFilterMode.Point;
    }
  }

  /**
   * 将 WebGL 纹理环绕方式枚举类型映射到 Galacean 纹理环绕方式枚举类型
   * @param wrap - WebGL 纹理环绕方式枚举类型
   * @returns Galacean 纹理环绕方式枚举类型
   */
  static toGalaceanTextureWrap (wrap?: GLenum): ENGINE.TextureWrapMode {
    switch (wrap) {
      case glContext.MIRRORED_REPEAT:
        return ENGINE.TextureWrapMode.Mirror;
      case glContext.REPEAT:
        return ENGINE.TextureWrapMode.Repeat;
      default:
        return ENGINE.TextureWrapMode.Clamp;
    }
  }

  /**
   * 构造函数
   * @param engine - Effects 引擎对象
   * @param data - 纹理数据
   * @param options - 纹理选项
   */
  constructor (
    public override engine: GalaceanEngine,
    data?: TextureDataType,
    options: TextureSourceOptions = {},
  ) {
    super(engine);

    if (data) {
      const { width = 1, height = 1 } = data;

      this.texture = this.createTextureByType({
        ...options as Texture2DSourceOptionsData,
        sourceType: TextureSourceType.data,
        data,
      });
      this.width = width;
      this.height = height;
    } else {
      this.texture = this.createTextureByType(options);
    }
    // 时序问题
    if (this.engine.textureArray) {
      this.texture && this.engine.textureArray.add(this.texture);
    }
  }

  override fromData (data: spec.EffectComponentData) {
    this.texture = this.createTextureByType(data as TextureSourceOptions);
    this.texture && this.engine.textureArray.add(this.texture);
  }

  /**
   * 更新纹理数据
   * @param options - 纹理选项
   */
  override updateSource (options: TextureSourceOptions) {
    this.texture?.destroy(true);
    this.texture = this.createTextureByType(options);
  }

  /**
   * 开始更新视频数据
   *
   */
  async startVideo () {
    if (this.sourceType === TextureSourceType.video) {
      if (!this.video.paused) {
        await this.video.play();
      }
    }
  }

  /**
   * 释放纹理占用的内存
   */
  override dispose () {
    if (this.destroyed || !this.texture) {
      return;
    }

    this.width = 0;
    this.height = 0;
    this.destroyed = true;
    this.initialize = throwDestroyedError;

    this.texture.destroy();
  }

  /**
   * 组装纹理选项
   * @param options - 纹理选项
   * @returns 组装后的纹理选项
   */
  override assembleOptions (options: TextureSourceOptions): TextureSourceOptions {
    const { target = glContext.TEXTURE_2D } = options;

    if (!options.sourceType) {
      if ('image' in options) {
        options.sourceType = TextureSourceType.image;
      } else if ('data' in options) {
        options.sourceType = TextureSourceType.data;
      } else if ('video' in options) {
        options.sourceType = TextureSourceType.video;
      } else {
        options.sourceType = TextureSourceType.none; // TextureSourceType.none
      }
    }

    // @ts-expect-error
    return {
      target,
      ...options,
      minFilter: GalaceanTexture.toGalaceanTextureFilter(options.minFilter),
      magFilter: GalaceanTexture.toGalaceanTextureFilter(options.magFilter),
      wrapS: GalaceanTexture.toGalaceanTextureWrap(options.wrapS),
      wrapT: GalaceanTexture.toGalaceanTextureWrap(options.wrapT),
    };
  }

  private createTextureByType (options: TextureSourceOptions): ENGINE.Texture2D | null {
    const assembleOptions = this.assembleOptions(options);
    const { flipY, wrapS, wrapT, magFilter, sourceType } = assembleOptions;
    const engine = this.engine.originalEngine;

    // 时序问题
    if (!engine) {
      return null;
    }

    let texture: ENGINE.Texture2D | undefined = undefined;
    // todo map
    const galaceanTextureFormat = ENGINE.TextureFormat.R8G8B8A8;

    this.sourceType = sourceType;

    if (sourceType === TextureSourceType.data) {
      const { data } = options as Texture2DSourceOptionsData;

      texture = new ENGINE.Texture2D(engine, data.width, data.height, galaceanTextureFormat, false);
      texture.setPixelBuffer(data.data);
      texture.wrapModeU = wrapS || ENGINE.TextureWrapMode.Clamp;
      texture.wrapModeV = wrapT || ENGINE.TextureWrapMode.Clamp;
      texture.filterMode = magFilter || ENGINE.TextureFilterMode.Bilinear;
      this.width = data.width;
      this.height = data.height;
    } else if (sourceType === TextureSourceType.image) {
      const { image } = options as Texture2DSourceOptionsImage;

      texture = new ENGINE.Texture2D(engine, image.width, image.height, galaceanTextureFormat, false);
      texture.setImageSource(image, 0, flipY);
      texture.wrapModeU = wrapS || ENGINE.TextureWrapMode.Clamp;
      texture.wrapModeV = wrapT || ENGINE.TextureWrapMode.Clamp;
      texture.filterMode = magFilter || ENGINE.TextureFilterMode.Bilinear;
      this.width = image.width;
      this.height = image.height;
    } else if (sourceType === TextureSourceType.none) {
      const pixel = new Uint8Array(4).fill(255);

      texture = new ENGINE.Texture2D(engine, 1, 1, ENGINE.TextureFormat.R8G8B8A8, true);
      texture.setPixelBuffer(pixel);
      texture.wrapModeU = ENGINE.TextureWrapMode.Repeat;
      texture.wrapModeV = ENGINE.TextureWrapMode.Repeat;
      this.width = this.height = 1;
    } else if (sourceType === TextureSourceType.video) {
      const { video } = options as Texture2DSourceOptionsVideo;

      this.video = video;

      texture = new ENGINE.Texture2D(engine, 1000, 1000, ENGINE.TextureFormat.R8G8B8A8, false);
      texture.setImageSource(video);
      texture.wrapModeU = ENGINE.TextureWrapMode.Repeat;
      texture.wrapModeV = ENGINE.TextureWrapMode.Repeat;
    }

    if (texture) {
      texture.name = this.name;

      return texture;
    }
    throw new Error('Create a texture using an unknown data type.');
  }
}
