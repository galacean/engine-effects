import type * as EFFECTS from '@galacean/effects-core';
import type {
  GeometryMeshProps, GeometryProps, MaterialProps, TextureDataType, TextureSourceOptions,
} from '@galacean/effects-core';
import { Texture, Geometry, Material, Mesh } from '@galacean/effects-core';
import { GalaceanTexture } from './galacean-texture';
import { GalaceanMaterial } from './material';
import { GalaceanGeometry } from './galacean-geometry';
import { GalaceanMesh } from './galacean-mesh';
import type { GalaceanEngine } from './galacean-engine';

export * from './galacean-sprite-component';
export * from './galacean-text-component';
export * from '@galacean/effects-core';

export * from './galacean-display-component';
export * from './galacean-texture';
export * from './material';
export * from './galacean-composition';
export * from './engine-instance';

/**
 * 图片的创建方法
 *
 * @param options - 图片创建参数
 * @returns Galacean 中的抽象图片对象
 */
Texture.create = (engine: EFFECTS.Engine, options?: TextureSourceOptions) => {
  return new GalaceanTexture(engine as GalaceanEngine, undefined, options) as Texture;
};

/**
 * 通过数据创建图片对象
 *
 * @param data - 图片数据
 * @param options - 图片创建参数
 * @returns Galacean 中的抽象图片对象
 */
Texture.createWithData = (
  engine: EFFECTS.Engine,
  data?: TextureDataType,
  options?: Record<string, unknown>,
) => {
  return new GalaceanTexture(engine as GalaceanEngine, data, options) as Texture;
};

/**
 * 材质球创建方法
 *
 * @param props - 材质球创建参数
 * @returns Galacean 中的抽象材质球对象
 */
Material.create = (engine: EFFECTS.Engine, props?: MaterialProps) => {
  return new GalaceanMaterial(engine as GalaceanEngine, props);
};

/**
 * geometry 创建方法
 *
 * @param options - geometry 创建参数
 * @returns THREE 中的抽象 geometry 对象
 */
Geometry.create = (engine: EFFECTS.Engine, options?: GeometryProps) => {
  return new GalaceanGeometry(engine as GalaceanEngine, options);
};

/**
 * mesh 创建方法
 *
 * @param props - mesh 创建参数
 * @returns THREE 中的抽象 mesh 对象
 */
Mesh.create = (engine: EFFECTS.Engine, props?: GeometryMeshProps) => {
  return new GalaceanMesh(engine as GalaceanEngine, props);
};

