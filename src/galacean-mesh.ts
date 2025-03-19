import * as ENGINE from '@galacean/engine';
import type {
  Geometry, Material, MaterialDestroyOptions, MeshDestroyOptions, GeometryMeshProps,
  Sortable, Renderer,
} from '@galacean/effects-core';
import { Mesh, DestroyOptions, math } from '@galacean/effects-core';
import type { GalaceanMaterial } from './material';
import type { GalaceanGeometry } from './galacean-geometry';
import type { GalaceanEngine } from './galacean-engine';
import type { GalaceanRenderer } from './galacean-renderer';

/**
 * mesh 抽象类的 Galacean 实现
 */
export class GalaceanMesh extends Mesh implements Sortable {
  /**
   * renderer 对象
   */
  galaceanMesh: ENGINE.MeshRenderer;
  geometries: Geometry[];
  started: boolean = false;

  /**
   * 构造函数
   *
   * @param engine - Effects 引擎对象
   * @param props - mesh 创建参数
   */
  constructor (
    public galaceanEngine: GalaceanEngine,
    props?: GeometryMeshProps,
  ) {
    const { material, geometry, priority = 0 } = props || {};
    const engine = galaceanEngine;

    super(engine, props);

    if (!geometry || !material) { return; }

    this.geometries = [geometry];
    this.material = material;

    const entity = new ENGINE.Entity(engine.originalEngine);

    this.galaceanMesh = entity.addComponent(ENGINE.MeshRenderer);
    this.galaceanEngine.meshArray.add(this.galaceanMesh);
    this.galaceanMesh.mesh = (geometry as GalaceanGeometry).geometry;
    this.galaceanMesh.setMaterial((material as GalaceanMaterial).galaceanMaterial);
    this.worldMatrix = entity.transform.worldMatrix as unknown as math.Matrix4;
    this.priority = priority;
  }

  override render (renderer: Renderer): void {
    // 兼容 spine 逻辑
    if (!this.started) {
      this.onStart();
    }
    if (this.isDestroyed || !this.getVisible()) {
      return;
    }

    const { galaceanCamera } = this.engine as GalaceanEngine;

    if (galaceanCamera) {
      const tempVPMat = new ENGINE.Matrix();

      (this.material as GalaceanMaterial).matrices['effects_MatrixV'] = math.Matrix4.fromArray(galaceanCamera.viewMatrix.elements);
      ENGINE.Matrix.multiply(galaceanCamera.projectionMatrix, galaceanCamera.viewMatrix, tempVPMat);
      (this.material as GalaceanMaterial).matrices['effects_MatrixVP'] = math.Matrix4.fromArray(tempVPMat.elements);
      (this.material as GalaceanMaterial).matrices['effects_MatrixInvV'] = math.Matrix4.fromArray(galaceanCamera.entity.transform.worldMatrix.elements);

    } else {
      const effectsCamera = (renderer as GalaceanRenderer).effectsCamera;

      this.material.setMatrix('effects_MatrixV', effectsCamera.getViewMatrix());
      this.material.setMatrix('effects_MatrixVP', effectsCamera.getViewProjectionMatrix());
      this.material.setMatrix('effects_MatrixInvV', effectsCamera.getInverseViewMatrix());
    }

    const tempWorld = math.Matrix4.fromArray(this.worldMatrix.elements);

    const effectsObjectToWorld = this.material.getMatrix('effects_ObjectToWorld');

    // 兼容 spine
    if (this.name.includes('Spine') && effectsObjectToWorld) {
      tempWorld.multiply(effectsObjectToWorld);
    }
    const originalM = new math.Matrix4().setFromArray(this.galaceanMesh.entity.transform.worldMatrix.elements);

    this.material.setMatrix('effects_ObjectToWorld', originalM.multiply(tempWorld));
    this.material.use(renderer, renderer.renderingData.currentFrame.globalUniforms);
  }

  /**
   * 设置 mesh 的渲染顺序
   *
   * @param v - 顺序 index
   */
  override set priority (v: number) {
    if (this.galaceanMesh) {
      // some particle is render error
      this.galaceanMesh.priority = v + 2;
      (this.engine as GalaceanEngine).maxPriority = Math.max(this.galaceanMesh.priority, (this.engine as GalaceanEngine).maxPriority);

    }
  }

  /**
   * 获取 mesh 的渲染顺序
   */
  override get priority () {
    // miniprogram renderer  sometime is undefined
    return this.galaceanMesh?.priority ?? 0;
  }

  /**
   * 设置 mesh 可见性
   *
   * @param val - 可见性开关
   */
  override setVisible (val: boolean): void {
    this.galaceanMesh.enabled = val;
  }

  /**
   * 获取 mesh 的可见性
   *
   * @returns
   */
  override getVisible (): boolean {
    return this.galaceanMesh.enabled;
  }

  /**
   * 设置 material
   *
   * @param material - material 对象
   * @param destroy - 销毁参数
   */
  override setMaterial (
    material: Material,
    destroy?: MaterialDestroyOptions | DestroyOptions.keep,
  ): void {
    if (destroy !== DestroyOptions.keep) {
      this.material.dispose(destroy);
    }
    this.material = material;
    this.galaceanMesh.setMaterial((material as GalaceanMaterial).galaceanMaterial);
  }

  override onStart (): void {
    super.onStart();
    // spine error
    this.started = true;
    (this.engine as GalaceanEngine).addEntity(this.galaceanMesh.entity);
    this.galaceanMesh.priority = this.priority / (this.engine as GalaceanEngine).maxPriority + (this.engine as GalaceanEngine).priority;
  }

  /**
   * 销毁方法
   *
   * @param options - 销毁参数
   */
  override dispose (options?: MeshDestroyOptions): void {
    if (this.destroyed) {
      return;
    }

    if (options?.geometries !== DestroyOptions.keep) {
      this.geometries.forEach(geometry => geometry.dispose());
    }
    const materialDestroyOption = options?.material;

    if (materialDestroyOption !== DestroyOptions.keep) {
      this.material.dispose(materialDestroyOption);
    }
    this.destroyed = true;
    this.galaceanMesh.destroy();
  }
}
