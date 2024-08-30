import * as ENGINE from '@galacean/engine';
import type { Attribute, GeometryProps, SkinProps, spec } from '@galacean/effects-core';
import { generateEmptyTypedArray, Geometry, glContext } from '@galacean/effects-core';
import { GalaceanComposition } from './galacean-composition';
import type { GalaceanEngine } from './galacean-engine';

/**
 * Galacean 中 attribute info 接口
 */
interface GalaceanAttributeWithType {
  /**
   * Galacean 中 attribute 对象
   */
  vertexElement: ENGINE.VertexElement,
  /**
   * 共享或单独的 buffer
   */
  vertexBufferBinding: ENGINE.VertexBufferBinding,
  bufferIndex: number,
  /**
   * CPU Buffer
   */
  rawBuffer: spec.TypedArray,
}

/**
 * Galacean 中的 geometry 的抽象实现类
 */
export class GalaceanGeometry extends Geometry {
  /**
   * geometry 对象
   */
  geometry: ENGINE.BufferMesh;
  /**
   * 记录顶点属性信息用于缓存
   */
  attributes: Record<string, GalaceanAttributeWithType> = {};
  elements: ENGINE.VertexElement[] = [];
  indexRawArray?: spec.TypedArray;
  indexBufferBinding?: ENGINE.IndexBufferBinding;

  /**
   * geometry 绘制模式
   */
  readonly mode: GLenum;

  private destroyed = false;
  private attributesName: string[] = [];
  private bufferIndex = 0;
  private readonly originalEngine: ENGINE.Engine;

  /**
   * 构造函数
   *
   * @param engine - Effects 引擎对象
   * @param props - Geometry 创建参数
   */
  constructor (
    public override engine: GalaceanEngine,
    props?: GeometryProps,
  ) {
    if (!props) {
      return;
    }

    const {
      drawStart = 0, drawCount, indices, mode,
    } = props;

    super(engine);
    this.originalEngine = engine.originalEngine;
    this.mode = mode ?? glContext.TRIANGLES;

    const attributesName: string[] = [];
    const attributes: Record<string, GalaceanAttributeWithType> = {};
    const geometry = new ENGINE.BufferMesh(this.originalEngine);

    engine.geometryArray.add(geometry);

    Object.keys(props.attributes).forEach(name => {
      const attr = props.attributes[name];

      if (!('dataSource' in attr)) {
        this.setAttributeType(name, attr, geometry, attributes, props.maxVertex);
      } else {
        // 使用AttributeWithType构造的attribute
        const { dataSource } = attr;

        if (dataSource) {
          if (attributes[dataSource] === undefined) {
            this.setAttributeType(dataSource, attr, geometry, attributes, props.maxVertex);
          }
          const { size, offset } = attr;
          const dataSourceAttribute = attributes[dataSource];
          const vertexBufferBinding = dataSourceAttribute.vertexBufferBinding;
          let format = ENGINE.VertexElementFormat.Vector3;

          switch (size) {
            case 1:
              format = ENGINE.VertexElementFormat.Float;

              break;
            case 2:
              format = ENGINE.VertexElementFormat.Vector2;

              break;
            case 3:
              format = ENGINE.VertexElementFormat.Vector3;

              break;
            case 4:
              format = ENGINE.VertexElementFormat.Vector4;

              break;
          }

          const vertexElement = new ENGINE.VertexElement(name, (offset ?? 0),
            format, dataSourceAttribute.vertexElement.bindingIndex);

          this.elements.push(vertexElement);
          attributes[name] = {
            vertexBufferBinding,
            vertexElement,
            rawBuffer: dataSourceAttribute.rawBuffer,
            bufferIndex: dataSourceAttribute.bufferIndex,
          };
        }
      }

      attributesName.push(name);
    });

    if (indices && indices.data) {
      const buffer = new ENGINE.Buffer(this.originalEngine, ENGINE.BufferBindFlag.IndexBuffer, indices.data, ENGINE.BufferUsage.Dynamic);

      this.engine.bufferArray.add(buffer);
      const indexBufferBinding = new ENGINE.IndexBufferBinding(buffer, ENGINE.IndexFormat.UInt16);

      this.indexBufferBinding = indexBufferBinding;
      this.indexRawArray = indices.data;
      geometry.setIndexBufferBinding(indexBufferBinding);
    }

    geometry.setVertexElements(this.elements);
    geometry.addSubMesh(new ENGINE.SubMesh(drawStart, drawCount ?? 0));

    this.geometry = geometry;
    this.attributes = attributes;
    this.attributesName = attributesName;
  }

  /**
   * 获取绘制数量
   */
  get drawCount (): number {
    return this.geometry.subMesh!.count;
  }

  /**
   * 设置绘制数量
   */
  set drawCount (val: number) {
    this.geometry.subMesh!.count = val;

  }

  /**
   * 设置绘制起点
   */
  override setDrawStart (count: number): void {
    this.drawStart = count;
  }

  override getSkinProps (): SkinProps {
    throw new Error('Method not implemented.');
  }

  /**
   * 获取绘制起点
   */
  override getDrawStart (): number {
    return this.drawStart;
  }

  /**
   * 获取绘制起点
   */
  get drawStart (): number {
    return this.geometry.subMesh!.start;
  }

  /**
   * 设置绘制起点
   */
  set drawStart (val: number) {
    this.geometry.subMesh!.start = val;
  }

  /**
   * 获取 attribute 数据
   *
   * @param name - attribute 名称
   * @returns 返回 attribute 数据，如果为空返回 undefined
   */
  getAttributeData (name: string): spec.TypedArray | undefined {
    if (this.attributes[name] == undefined) {
      return;
    }

    return this.attributes[name].rawBuffer;
  }

  /**
   * 设置 attribute 数据
   *
   * @param name - attribute 名称
   * @param data - attribute 数据
   * @returns
   */
  setAttributeData (name: string, data: spec.TypedArray): void {
    if (this.attributes[name] == undefined) {
      return;
    }

    const attribute = this.attributes[name];
    const buffer = new ENGINE.Buffer(
      this.originalEngine,
      ENGINE.BufferBindFlag.VertexBuffer,
      data,
      ENGINE.BufferUsage.Dynamic,
    );

    this.engine?.bufferArray.add(buffer);
    const vertexBufferBinding = new ENGINE.VertexBufferBinding(buffer, attribute.vertexBufferBinding.stride);

    this.geometry.setVertexBufferBinding(vertexBufferBinding, attribute.bufferIndex);
    attribute.vertexBufferBinding = vertexBufferBinding;
  }

  /**
   * 设置可变的 attribute 数据
   *
   * @param name - attribute 名称
   * @param dataOffset - 数据偏移
   * @param data - 数据内容
   * @returns
   */
  setAttributeSubData (name: string, dataOffset: number, data: spec.TypedArray): void {
    if (this.attributes[name] == undefined) {
      return;
    }

    const attribute = this.attributes[name];

    attribute.rawBuffer.set(data, dataOffset);
    // hack
    attribute.vertexBufferBinding.buffer.setData(attribute.rawBuffer, dataOffset * data.BYTES_PER_ELEMENT, dataOffset, data.length);
  }

  /**
   * 获取 attribute 数据步长
   *
   * @param name - attribute名称
   * @returns 步长值
   */
  getAttributeStride (name: string): number {
    const attribute = this.attributes[name];

    return attribute.vertexBufferBinding.stride;
  }

  /**
   * 获取用到的所有 attribute 名称
   * @returns 名称数组
   */
  getAttributeNames (): string[] {
    return this.attributesName;
  }

  /**
   * 获取 index attribute 数据
   * @returns 如果为空返回 undefined
   */
  getIndexData (): spec.TypedArray | undefined {
    return this.indexRawArray;
  }

  /**
   * 设置 index attribute 数据
   *
   * @param data - index 数据
   */
  setIndexData (data?: spec.TypedArray): void {
    if (
      data === undefined ||
      this.indexRawArray === undefined
    ) {
      return;
    }

    if (data.length > this.indexRawArray.length) {
      this.indexRawArray = data;
      const buffer = new ENGINE.Buffer(this.originalEngine, ENGINE.BufferBindFlag.IndexBuffer, data);

      this.engine?.bufferArray.add(buffer);
      this.indexBufferBinding = new ENGINE.IndexBufferBinding(buffer, ENGINE.IndexFormat.UInt16);
      this.geometry.setIndexBufferBinding(this.indexBufferBinding);
    } else {
      this.indexRawArray.set(data);
      this.indexBufferBinding?.buffer.setData(this.indexRawArray, 0);
    }
  }

  /**
   * 设置偏移 index 数据
   *
   * @param offset - 数据偏移量
   * @param data - 数据内容
   */
  setIndexSubData (offset: number, data: spec.TypedArray): void {
    if (
      data === undefined ||
      this.indexRawArray === undefined
    ) {
      return;
    }

    this.indexRawArray.set(data, offset);
    this.indexBufferBinding?.buffer.setData(this.indexRawArray, 0);
  }

  /**
   * 设置绘制数量
   *
   * @param count - 绘制数量
   */
  setDrawCount (count: number): void {
    this.drawCount = count;
  }

  /**
   * 获取绘制数量
   *
   * @returns
   */
  getDrawCount (): number {
    return this.drawCount;
  }

  /**
   * 销毁方法
   *
   * @returns
   */
  override dispose (): void {
    if (this.destroyed) {
      return;
    }

    this.geometry.destroy();
    this.drawCount = 0;

    this.drawStart = 0;
    this.attributes = {};
    this.attributesName = [];
    this.attributes = {};
    this.attributesName = [];
    this.bufferIndex = 0;
    this.indexRawArray = undefined;
    this.indexBufferBinding = undefined;
    this.elements = [];
    this.destroyed = true;
  }

  private setAttributeType (
    name: string,
    attr: Attribute,
    geometry: ENGINE.BufferMesh,
    attributes: Record<string, GalaceanAttributeWithType>,
    maxCount?: number,
  ) {
    const { size, offset, type = glContext.FLOAT } = attr;
    let { stride, data } = attr as spec.AttributeWithData;

    if (type && !data) {
      data = generateEmptyTypedArray(type);
    }

    if (!data) {
      return;
    }
    if (name === 'aSprite') {
      stride = 12;
    } else {
      stride = stride ?? 0;
    }

    if (maxCount) {
      const length = maxCount * stride + (GalaceanComposition.shape[name] ?? 0);

      // 如果传入了data且data.length不为0 使用传入的data 否则根据length新建数组
      if (data.length === 0) {
        data = data instanceof Float32Array ? new Float32Array(length) : new Uint16Array(length);
      }
    }

    let format = ENGINE.VertexElementFormat.Vector3;

    switch (size) {
      case 1:
        format = ENGINE.VertexElementFormat.Float;

        break;
      case 2:
        format = ENGINE.VertexElementFormat.Vector2;

        break;
      case 3:
        format = ENGINE.VertexElementFormat.Vector3;

        break;
      case 4:
        format = ENGINE.VertexElementFormat.Vector4;

        break;
    }

    const buffer = new ENGINE.Buffer(
      this.originalEngine,
      ENGINE.BufferBindFlag.VertexBuffer,
      data,
      ENGINE.BufferUsage.Stream,
    );

    this.engine?.bufferArray.add(buffer);
    const vertexBufferBinding = new ENGINE.VertexBufferBinding(buffer, stride);
    const vertexElement = new ENGINE.VertexElement(name, offset ?? 0, format, this.bufferIndex);

    this.elements.push(vertexElement);
    attributes[name] = {
      vertexElement,
      vertexBufferBinding,
      rawBuffer: data,
      bufferIndex: this.bufferIndex,
    };

    geometry.setVertexBufferBinding(vertexBufferBinding, this.bufferIndex);
    this.bufferIndex++;
  }
}
