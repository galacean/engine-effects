import * as ENGINE from '@galacean/engine';
import type { Renderer, SpriteItemProps } from '@galacean/effects-core';
import { SpriteComponent, effectsClass, math, spec } from '@galacean/effects-core';
import type { GalaceanEngine } from './galacean-engine';
import type { GalaceanGeometry } from './galacean-geometry';
import type { GalaceanMaterial } from './material';
import type { GalaceanRenderer } from './galacean-renderer';

@effectsClass(spec.DataType.SpriteComponent)
export class GalaceanSpriteComponent extends SpriteComponent {
  galaceanMesh: ENGINE.MeshRenderer;

  constructor (engine: GalaceanEngine, props?: SpriteItemProps) {
    super(engine, props);
  }

  /**
   * 设置 mesh 的渲染顺序
   *
   * @param v - 顺序 index
   */
  override set priority (v: number) {
    if (this.galaceanMesh) {
      this.galaceanMesh.priority = v;
      (this.engine as GalaceanEngine).maxPriority = Math.max(this.galaceanMesh.priority, (this.engine as GalaceanEngine).maxPriority);
    }
  }
  /**
   * 获取 mesh 的渲染顺序
   */
  override get priority () {
    return this.galaceanMesh.priority;
  }

  override setVisible (visible: boolean): void {
    if (this.galaceanMesh) {
      this.galaceanMesh.enabled = visible;
    }
  }
  override getVisible (): boolean {
    return this.galaceanMesh.enabled;
  }

  override onStart (): void {
    super.onStart();
    if (this.galaceanMesh) {
      (this.engine as GalaceanEngine).addEntity(this.galaceanMesh.entity);
      this.galaceanMesh.priority = this.priority / (this.engine as GalaceanEngine).maxPriority + (this.engine as GalaceanEngine).priority;
    }
  }

  override get enabled (): boolean {
    return this.galaceanMesh.enabled;
  }
  override set enabled (value: boolean) {
    if (this.galaceanMesh) {
      this.galaceanMesh.enabled = value;
    }
  }

  override render (renderer: Renderer): void {
    if (!this.galaceanMesh || !this.isActiveAndEnabled) { return; }

    const engine = this.engine as GalaceanEngine;
    const material = this.material as GalaceanMaterial;
    const galaceanCamera = engine.galaceanCamera;

    material.setVector2('_Size', this.transform.size);

    if (galaceanCamera) {
      const tempVPMat = new ENGINE.Matrix();

      ENGINE.Matrix.multiply(galaceanCamera.projectionMatrix, galaceanCamera.viewMatrix, tempVPMat);
      material.matrices['effects_MatrixVP'] = new math.Matrix4().setFromArray(tempVPMat.elements);
    } else {
      const effectsCamera = (renderer as GalaceanRenderer).effectsCamera;

      material.setMatrix('effects_MatrixVP', effectsCamera.getViewProjectionMatrix());
    }

    const tempWorld = new math.Matrix4().multiply(this.transform.getWorldMatrix());
    const originalM = new math.Matrix4().setFromArray(this.galaceanMesh.entity.transform.worldMatrix.elements);

    material.setMatrix('effects_ObjectToWorld', originalM.multiply(tempWorld));
    // material.setMatrix('effects_ObjectToWorld', this.transform.getWorldMatrix());
    material.use(renderer, renderer.renderingData.currentFrame.globalUniforms);
  }

  /**
   * 从数据中初始化
   *
   * @param data - 数据
   */
  override fromData (data: SpriteItemProps): void {
    super.fromData(data);

    if (this.galaceanMesh) {
      return;
    }
    const engine = this.engine as GalaceanEngine;
    const material = this.material as GalaceanMaterial;
    const geometry = this.geometry as GalaceanGeometry;
    const entity = new ENGINE.Entity(engine.originalEngine);

    this.galaceanMesh = entity.addComponent(ENGINE.MeshRenderer);
    this.galaceanMesh.mesh = geometry.geometry;

    material.setMatrix('effects_ObjectToWorld', this.transform.getWorldMatrix());
    const mVP = this.item.composition?.camera.getViewProjectionMatrix() || new math.Matrix4();

    material.setMatrix('effects_MatrixVP', mVP);
    this.galaceanMesh.setMaterial(material.galaceanMaterial);
  }

  override dispose (): void {
    super.dispose();
    if (this.galaceanMesh) {
      this.galaceanMesh.entity?.destroy();
    }
  }
}
