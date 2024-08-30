import * as ENGINE from '@galacean/engine';
import * as EFFECTS from '@galacean/effects-core';

type ScriptProps = {
  entity: ENGINE.Entity,
  camera?: ENGINE.Camera,
};

export class GalaceanEngine extends EFFECTS.Engine {
  bufferArray: Set<ENGINE.Buffer> = new Set();
  geometryArray: Set<ENGINE.BufferMesh> = new Set();
  textureArray: Set<ENGINE.Texture2D> = new Set();
  meshArray: Set<ENGINE.MeshRenderer> = new Set();
  materialArray: Set<ENGINE.Material> = new Set();
  galaceanCamera?: ENGINE.Camera;
  /**
   * 用户设置的优先级
   */
  priority = 0;
  /**
   * 当前合成的最大优先级
   */
  maxPriority = 0;
  /**
   * 每个合成的根节点
   */
  entity: ENGINE.Entity;

  constructor (
    gl: WebGL2RenderingContext | WebGLRenderingContext,
    public originalEngine: ENGINE.Engine,
    private scriptProps: ScriptProps,
  ) {
    super();

    this.gpuCapability = new EFFECTS.GPUCapability(gl);
    this.galaceanCamera = scriptProps.camera;
  }

  /**
   * 创建根节点
   */
  createEntity () {
    this.entity = new ENGINE.Entity(this.originalEngine);
    this.scriptProps.entity.addChild(this.entity);
  }

  /**
   * 添加节点到合成根节点
   * @param entity - 节点对象
   */
  addEntity (entity: ENGINE.Entity) {
    this.entity.addChild(entity);

  }

  clearAssets (
    resourceManager: ENGINE.ResourceManager,
    asset: ENGINE.MeshRenderer | ENGINE.Texture2D | ENGINE.Buffer | ENGINE.BufferMesh | ENGINE.Shader | ENGINE.Material,
  ) {
    if (asset.destroy) {
      asset.destroy(true);
    }

    // @ts-expect-error
    resourceManager._deleteAsset(asset);
    // @ts-expect-error
    resourceManager._deleteContentRestorer(asset);
    // @ts-expect-error
    resourceManager._deleteReferResource(asset);
    // @ts-expect-error
    resourceManager._deleteGraphicResource(asset);
  }

  override dispose (): void {
    const resourceManager = this.originalEngine.resourceManager;

    this.meshArray.forEach(mesh => {
      this.clearAssets(resourceManager, mesh);
    });
    this.meshArray.clear();
    this.geometryArray.forEach(geo => {
      this.clearAssets(resourceManager, geo);
    });
    this.geometryArray.clear();
    this.materialArray.forEach(mat => {
      this.clearAssets(resourceManager, mat);
    });
    this.materialArray.clear();
    this.textureArray.forEach(tex => {
      this.clearAssets(resourceManager, tex);
    });
    this.textureArray.clear();
    this.bufferArray.forEach(buffer => {
      this.clearAssets(resourceManager, buffer);
    });
    this.bufferArray.clear();
  }
}
