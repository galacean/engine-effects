import * as ENGINE from '@galacean/engine';
import type {
  MaterialProps, Texture, MaterialDestroyOptions, UndefinedAble, GlobalUniforms, Renderer, Engine,
} from '@galacean/effects-core';
import {
  ShaderType, ShaderFactory, math, DestroyOptions, Material, spec, throwDestroyedError,
  Shader, generateGUID,
} from '@galacean/effects-core';
import {
  CONSTANT_MAP_BLEND_OPERARION, CONSTANT_MAP_STENCIL_FUNC, CONSTANT_MAP_STENCIL_OP,
  CONSTANT_MAP_DEPTH, CONSTANT_MAP_BLEND,
} from './galacean-material-util';
import type { GalaceanTexture } from '../galacean-texture';
import type { GalaceanEngine } from '../galacean-engine';

/**
 * Galacean 抽象材质类
 */
export class GalaceanMaterial extends Material {

  static UUID = 0;

  /**
   * 储存浮点数类型的 uniform 值
   */
  floats: Record<string, number> = {};

  /**
   * 储存整型数类型的 uniform 值
   */
  ints: Record<string, number> = {};

  /**
   * 储存二维向量类型的 uniform 值
   */
  vector2s: Record<string, math.Vector2> = {};

  /**
   * 储存三维向量类型的 uniform 值
   */
  vector3s: Record<string, math.Vector3> = {};

  /**
   * 储存四维向量类型的 uniform 值
   */
  vector4s: Record<string, math.Vector4> = {};

  /**
   * 储存 4x4 矩阵类型的 uniform 值
   */
  matrices: Record<string, math.Matrix4> = {};

  /**
   * 储存 4x4 矩阵类型的 uniform 值
   */
  matrice3s: Record<string, math.Matrix3> = {};

  /**
   * 储存纹理类型的 uniform 值
   */
  textures: Record<string, Texture> = {};

  /**
   * 储存浮点数数组类型的 uniform 值
   */
  floatArrays: Record<string, number[]> = {};

  /**
   * 储存四维向量数组类型的 uniform 值
   */
  vector4Arrays: Record<string, number[]> = {};

  /**
   * 储存 4x4 矩阵数组类型的 uniform 值
   */
  matrixArrays: Record<string, number[]> = {};

  /**
   * Galacean 原始着色器材质对象
   */
  galaceanMaterial: ENGINE.Material;

  private colors: Record<string, math.Color> = {};
  private quaternions: Record<string, math.Quaternion> = {};

  private readonly macros: Record<string, number | boolean> = {};
  private readonly originalEngine: ENGINE.Engine;

  /**
   * 构造函数
   *
   * @param engine - Effects 引擎对象
   * @param props - 材质属性
   */
  constructor (
    engine: GalaceanEngine,
    props?: MaterialProps,
  ) {
    super(engine as unknown as Engine, props);

    if (!props) { return; }

    const shader = props?.shader;

    this.shader = new Shader(engine as unknown as Engine);
    this.shader.shaderData = {
      ...shader,
      id: generateGUID(),
      dataType: spec.DataType.Shader,
      vertex: shader?.vertex ?? '',
      fragment: shader?.fragment ?? '',
    };
    const { level } = this.engine.gpuCapability;
    const vertexShaderSource = ShaderFactory.genFinalShaderCode({
      level,
      shaderType: ShaderType.vertex,
      shader: shader?.vertex ?? '',
      macros: shader?.macros,
      removeVersion: true,
    });
    const fragmentShaderSource = ShaderFactory.genFinalShaderCode(
      {
        level,
        shaderType: ShaderType.fragment,
        shader: shader?.fragment ?? '',
        macros: shader?.macros,
        removeVersion: true,
      }
    );

    this.originalEngine = engine.originalEngine;
    this.galaceanMaterial = new ENGINE.Material(
      this.originalEngine,
      ENGINE.Shader.create(this.name, vertexShaderSource, fragmentShaderSource),
    );
    this.galaceanMaterial.renderState.renderQueueType = ENGINE.RenderQueueType.Transparent;
    this.galaceanMaterial.name = 'ge_' + this.name;
    this.setMatrix('effects_ObjectToWorld', new math.Matrix4());
    this.setMatrix('effects_MatrixVP', new math.Matrix4());
    this.setMatrix('effects_MatrixInvV', new math.Matrix4());
    this.setMatrix('effects_MatrixV', new math.Matrix4());

    engine.materialArray.add(this.galaceanMaterial);
  }

  override enableMacro (keyword: string, value?: number | boolean): void {
    if (!this.isMacroEnabled(keyword) || this.macros[keyword] !== value) {
      this.macros[keyword] = value ?? true;
    }
  }
  override disableMacro (keyword: string): void {
    if (this.isMacroEnabled(keyword)) {
      delete this.macros[keyword];
    }
  }
  override isMacroEnabled (keyword: string): boolean {
    return this.macros[keyword] !== undefined;
  }

  /**
   * 获取混合模式
   */
  override get blending (): boolean {
    return this.galaceanMaterial.renderState.blendState.targetBlendState.enabled;
  }
  override set blending (blending: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.blendState.targetBlendState.enabled = !!blending;
  }

  /**
   * 获取混合函数
   */
  override get blendFunction () {
    const {
      sourceColorBlendFactor, destinationColorBlendFactor,
      sourceAlphaBlendFactor, destinationAlphaBlendFactor,
    } = this.galaceanMaterial.renderState.blendState.targetBlendState;

    return [
      sourceColorBlendFactor,
      destinationColorBlendFactor,
      sourceAlphaBlendFactor || sourceColorBlendFactor,
      destinationAlphaBlendFactor || destinationColorBlendFactor,
    ];
  }
  override set blendFunction (
    func: UndefinedAble<[blendSrc: number, blendDst: number, blendSrcAlpha: number, blendDstAlpha: number]>,
  ) {
    if (!func) {
      return;
    }

    const [blendSrc, blendDst, blendSrcAlpha, blendDstAlpha] = func;

    this.galaceanMaterial.renderState.blendState.targetBlendState.sourceColorBlendFactor = CONSTANT_MAP_BLEND[blendSrc];
    this.galaceanMaterial.renderState.blendState.targetBlendState.destinationColorBlendFactor = CONSTANT_MAP_BLEND[blendDst];
    this.galaceanMaterial.renderState.blendState.targetBlendState.sourceAlphaBlendFactor = CONSTANT_MAP_BLEND[blendSrcAlpha];
    this.galaceanMaterial.renderState.blendState.targetBlendState.destinationAlphaBlendFactor = CONSTANT_MAP_BLEND[blendDstAlpha];
  }

  /**
   * 获取混合方程式
   */
  override get blendEquation () {
    const {
      colorBlendOperation,
      alphaBlendOperation,
    } = this.galaceanMaterial.renderState.blendState.targetBlendState;

    return [colorBlendOperation, alphaBlendOperation || colorBlendOperation];
  }
  override set blendEquation (equation: UndefinedAble<[rgb: number, alpha: number]>) {
    if (equation) {
      const [rgb, alpha] = equation;

      this.galaceanMaterial.renderState.blendState.targetBlendState.colorBlendOperation = CONSTANT_MAP_BLEND_OPERARION[rgb];
      this.galaceanMaterial.renderState.blendState.targetBlendState.alphaBlendOperation = CONSTANT_MAP_BLEND_OPERARION[alpha];
    }
  }

  /**
   * 获取深度测试结果
   */
  override get depthTest (): boolean {
    return this.galaceanMaterial.renderState.depthState.enabled;
  }
  override set depthTest (value: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.depthState.enabled = !!value;
  }

  /**
   * 获取深度缓冲区结果
   */
  override get depthMask (): boolean {
    return this.galaceanMaterial.renderState.depthState.writeEnabled;
  }
  override set depthMask (value: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.depthState.writeEnabled = !!value;
  }

  /**
   * 获取深度函数
   */
  override get depthFunc () {
    return this.galaceanMaterial.renderState.depthState.compareFunction;
  }
  override set depthFunc (value: UndefinedAble<number>) {
    if (value !== undefined) {
      this.galaceanMaterial.renderState.depthState.compareFunction = CONSTANT_MAP_DEPTH[value];
    }
  }

  /**
   * 获取多边形偏移开关
   */
  override get polygonOffsetFill (): boolean {
    return true;
  }
  override set polygonOffsetFill (value: UndefinedAble<boolean>) {
  }

  /**
   * 获取多边形偏移
   */
  override get polygonOffset () {
    return [
      this.galaceanMaterial.renderState.rasterState.slopeScaledDepthBias,
      this.galaceanMaterial.renderState.rasterState.depthBias,
    ];
  }
  override set polygonOffset (value: UndefinedAble<[number, number]>) {
    if (value) {
      const [factor, units] = value;

      this.galaceanMaterial.renderState.rasterState.slopeScaledDepthBias = factor;
      this.galaceanMaterial.renderState.rasterState.depthBias = units;
    }
  }

  /**
   * 获取 alpha 抖动
   */
  override get sampleAlphaToCoverage (): boolean {
    return this.galaceanMaterial.renderState.blendState.alphaToCoverage;
  }
  override set sampleAlphaToCoverage (value: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.blendState.alphaToCoverage = !!value;
  }

  /**
   * 获取模板测试开关
   */
  override get stencilTest () {
    return this.galaceanMaterial.renderState.stencilState.enabled;
  }
  override set stencilTest (value: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.stencilState.enabled = !!value;
  }

  /**
   * 获取模板缓冲区
   */
  override get stencilMask () {
    return [
      this.galaceanMaterial.renderState.stencilState.writeMask,
      this.galaceanMaterial.renderState.stencilState.writeMask,
    ];
  }
  override set stencilMask (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.writeMask = value[0];
    }
  }

  /**
   * 获取模板测试参考值
   */
  override get stencilRef () {
    return [
      this.galaceanMaterial.renderState.stencilState.referenceValue,
      this.galaceanMaterial.renderState.stencilState.referenceValue,
    ];
  }
  override set stencilRef (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.referenceValue = value[0];
    }
  }

  /**
   * 获取模版函数
   */
  override get stencilFunc () {
    return [
      this.galaceanMaterial.renderState.stencilState.compareFunctionFront,
      this.galaceanMaterial.renderState.stencilState.compareFunctionBack,
    ];
  }
  override set stencilFunc (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.compareFunctionFront = CONSTANT_MAP_STENCIL_FUNC[value[0]];
      this.galaceanMaterial.renderState.stencilState.compareFunctionBack = CONSTANT_MAP_STENCIL_FUNC[value[1]];
    }
  }

  /**
   * 获取模板测试失败后参数
   */
  override get stencilOpFail () {
    return [
      this.galaceanMaterial.renderState.stencilState.failOperationFront,
      this.galaceanMaterial.renderState.stencilState.failOperationBack,
    ];
  }
  override set stencilOpFail (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.failOperationFront = CONSTANT_MAP_STENCIL_OP[value[0]];
      this.galaceanMaterial.renderState.stencilState.failOperationBack = CONSTANT_MAP_STENCIL_OP[value[0]];
    }
  }

  /**
   * 获取模版测试通过深度测试失败后参数
   */
  override get stencilOpZFail () {
    return [
      this.galaceanMaterial.renderState.stencilState.zFailOperationFront,
      this.galaceanMaterial.renderState.stencilState.zFailOperationBack,
    ];
  }
  override set stencilOpZFail (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.zFailOperationFront = CONSTANT_MAP_STENCIL_OP[value[0]];
      this.galaceanMaterial.renderState.stencilState.zFailOperationBack = CONSTANT_MAP_STENCIL_OP[value[1]];
    }
  }

  /**
   * 获取模版测试通过并设置深度值参数
   */
  override get stencilOpZPass () {
    return [
      this.galaceanMaterial.renderState.stencilState.passOperationFront,
      this.galaceanMaterial.renderState.stencilState.passOperationBack,
    ];
  }
  override set stencilOpZPass (value: UndefinedAble<[number, number]>) {
    if (value) {
      this.galaceanMaterial.renderState.stencilState.passOperationFront = CONSTANT_MAP_STENCIL_OP[value[0]];
      this.galaceanMaterial.renderState.stencilState.passOperationBack = CONSTANT_MAP_STENCIL_OP[value[0]];
    }
  }

  /**
   * 获取剔除开关
   */
  override get culling () {
    return this.galaceanMaterial.renderState.rasterState.cullMode !== ENGINE.CullMode.Off;
  }
  override set culling (value: UndefinedAble<boolean>) {
    this.galaceanMaterial.renderState.rasterState.cullMode = value ? ENGINE.CullMode.Front : ENGINE.CullMode.Off;
  }

  /**
   * 获取剔除面
   */
  override get cullFace () {
    return this.galaceanMaterial.renderState.rasterState.cullMode;
  }
  override set cullFace (value: UndefinedAble<number>) {
    if (value === spec.SideMode.FRONT) {
      this.galaceanMaterial.renderState.rasterState.cullMode = ENGINE.CullMode.Back;
    } else if (value === spec.SideMode.BACK) {
      this.galaceanMaterial.renderState.rasterState.cullMode = ENGINE.CullMode.Front;
    } else {
      this.galaceanMaterial.renderState.rasterState.cullMode = ENGINE.CullMode.Off;
    }
  }

  override cloneUniforms (sourceMaterial: Material): void {
    //TODO：暂时不实现
  }

  getTexture (name: string): Texture | null {
    return this.textures[name];
  }
  setTexture (name: string, texture: Texture): void {
    if (this.destroyed) { return; }

    const { texture: engineTexture } = texture as GalaceanTexture;

    engineTexture && this.galaceanMaterial.shaderData.setTexture(name, engineTexture);
    this.textures[name] = texture;
  }

  getVector4Array (name: string): number[] {
    if (this.galaceanMaterial && !this.destroyed) {
      return Array.from(this.galaceanMaterial.shaderData.getFloatArray(name));
    } else {
      return [];
    }
  }
  setVector4Array (name: string, array: math.Vector4[] | number[]): void {
    if (this.destroyed) { return; }

    const value: number[] = [];

    for (const v of array) {
      // 兼容 number[]
      if (v instanceof math.Vector4) {
        value.push(v.x, v.y, v.z, v.w);
      } else {
        value.push(v);
      }
    }
    this.galaceanMaterial.shaderData.setFloatArray(name, new Float32Array(value));
    this.vector4Arrays[name] = value;
  }

  override use (render: Renderer, globalUniforms: GlobalUniforms): void {
    let name: string;

    // 检查贴图数据是否初始化。
    for (name in this.textures) {
      this.textures[name].initialize();
    }
    for (name in this.floats) {
      this.setFloat(name, this.floats[name]);
    }
    for (name in this.ints) {
      this.setInt(name, this.ints[name]);
    }
    for (name in this.floatArrays) {
      this.setFloats(name, this.floatArrays[name]);
    }
    for (name in this.textures) {
      this.setTexture(name, this.textures[name]);
    }
    for (name in this.vector2s) {
      this.setVector2(name, this.vector2s[name]);
    }
    for (name in this.vector3s) {
      this.setVector3(name, this.vector3s[name]);
    }
    for (name in this.vector4s) {
      this.setVector4(name, this.vector4s[name]);
    }
    for (name in this.colors) {
      this.setColor(name, this.colors[name]);
    }
    for (name in this.quaternions) {
      this.setQuaternion(name, this.quaternions[name]);
    }
    for (name in this.matrices) {
      this.setMatrix(name, this.matrices[name]);
    }
    for (name in this.matrice3s) {
      this.setMatrix3(name, this.matrice3s[name]);
    }
    for (name in this.vector4Arrays) {
      this.setVector4Array(name, this.vector4Arrays[name]);
    }
    for (name in this.matrixArrays) {
      // @ts-expect-error
      this.setMatrixArray(name, this.matrixArrays[name]);
    }
  }
  checkUniform (name: string) {
    throw new Error('Method not implemented.');
  }

  getMatrixArray (name: string): number[] | null {
    if (this.galaceanMaterial && !this.destroyed) {
      return Array.from(this.galaceanMaterial.shaderData.getFloatArray(name));
    } else {
      return [];
    }
  }
  setMatrixArray (name: string, array: math.Matrix4[]): void {
    if (this.destroyed) { return; }

    const value: number[] = [];

    for (const { elements } of array) {
      value.push(
        elements[0],
        elements[1],
        elements[2],
        elements[3],
        elements[4],
        elements[5],
        elements[6],
        elements[7],
        elements[8],
        elements[9],
        elements[10],
        elements[11],
        elements[12],
        elements[13],
        elements[14],
        elements[15],
      );
    }
    this.galaceanMaterial.shaderData.setFloatArray(name, new Float32Array(value));
    this.matrixArrays[name] = value;
  }

  getMatrix (name: string): math.Matrix4 | null {
    return this.matrices[name];
  }
  setMatrix (name: string, value: math.Matrix4): void {
    if (this.destroyed) { return; }

    const mat = new ENGINE.Matrix().copyFrom(value as unknown as ENGINE.Matrix);

    this.galaceanMaterial.shaderData.setMatrix(name, mat);
    this.matrices[name] = value;
  }

  override setMatrix3 (name: string, value: math.Matrix3): void {
    if (this.destroyed) { return; }

    const array = value.toArray();

    this.galaceanMaterial.shaderData.setFloatArray(name, new Float32Array(array));
    this.matrixArrays[name] = array;
  }

  override setMatrixNumberArray (name: string, array: number[]): void {
    if (this.destroyed) { return; }
    const value: number[] = [];

    for (const v of array) {
      for (let i = 0; i < 16; i++) {
        value.push(v);
      }
    }
    this.galaceanMaterial.shaderData.setFloatArray(name, new Float32Array(value));
    this.matrixArrays[name] = value;
  }

  getVector2 (name: string): math.Vector2 | null {
    return this.vector2s[name];
  }
  setVector2 (name: string, value: math.Vector2): void {
    if (this.destroyed) { return; }
    const vec = new ENGINE.Vector2();

    vec.x = value.x;
    vec.y = value.y;

    this.galaceanMaterial.shaderData.setVector2(name, vec);
    this.vector2s[name] = value;
  }

  getVector3 (name: string): math.Vector3 {
    return this.vector3s[name];
  }
  setVector3 (name: string, value: math.Vector3): void {
    if (this.destroyed) { return; }
    const vec = new ENGINE.Vector3();

    vec.x = value.x;
    vec.y = value.y;
    vec.z = value.z;

    this.galaceanMaterial.shaderData.setVector3(name, vec);
    this.vector3s[name] = value;
  }

  getVector4 (name: string): math.Vector4 | null {
    return this.vector4s[name];
  }
  setVector4 (name: string, value: math.Vector4): void {
    if (this.destroyed) { return; }
    const vec = new ENGINE.Vector4();

    vec.x = value.x;
    vec.y = value.y;
    vec.z = value.z;
    vec.w = value.w;

    this.galaceanMaterial.shaderData.setVector4(name, vec);
    this.vector4s[name] = value;
  }

  getFloat (name: string): number | null {
    return this.floats[name];
  }
  setFloat (name: string, value: number): void {
    if (this.destroyed) { return; }

    this.galaceanMaterial.shaderData.setFloat(name, value);
    this.floats[name] = value;
  }

  getFloats (name: string): number[] | null {
    return this.floatArrays[name];
  }
  setFloats (name: string, value: number[]): void {
    if (this.destroyed) { return; }

    this.galaceanMaterial.shaderData.setFloatArray(name, new Float32Array(value));
    this.floatArrays[name] = value;
  }

  getInt (name: string): number | null {
    return this.ints[name];
  }
  setInt (name: string, value: number): void {
    if (this.destroyed) { return; }
    this.galaceanMaterial.shaderData.setInt(name, value);
    this.ints[name] = value;
  }

  hasUniform (name: string): boolean {
    const shaderData = this.galaceanMaterial.shaderData;

    return !!(
      shaderData.getTexture(name) ||
      shaderData.getFloat(name) ||
      shaderData.getInt(name) ||
      shaderData.getVector2(name) ||
      shaderData.getVector3(name) ||
      shaderData.getVector4(name) ||
      shaderData.getMatrix(name) ||
      shaderData.getFloatArray(name) ||
      shaderData.getIntArray(name)
    );
  }

  disableKeyword (keyword: string): void {
    throw new Error('Method not implemented.');
  }
  isKeywordEnabled (keyword: string): boolean {
    throw new Error('Method not implemented.');
  }

  override clone (props?: MaterialProps | undefined): Material {
    throw new Error('Method not implemented.');
  }

  private clear () {
    // @ts-expect-error
    this.uniformSemantics = {};
    this.floats = {};
    this.ints = {};
    this.vector2s = {};
    this.vector3s = {};
    this.vector4s = {};
    this.matrices = {};
    this.matrice3s = {};
    this.textures = {};
    this.floatArrays = {};
    this.vector4Arrays = {};
    this.matrixArrays = {};
    this.initialize = throwDestroyedError;
    this.destroyed = true;
  }

  override getColor (name: string): math.Color | null {
    throw new Error('Method not implemented.');
  }
  override setColor (name: string, value: math.Color): void {
    throw new Error('Method not implemented.');
  }
  override getQuaternion (name: string): math.Quaternion | null {
    throw new Error('Method not implemented.');
  }
  override setQuaternion (name: string, value: math.Quaternion): void {
    throw new Error('Method not implemented.');
  }

  override dispose (destroyOptions?: MaterialDestroyOptions): void {
    if (this.destroyed) {
      return;
    }

    if (destroyOptions?.textures !== DestroyOptions.keep) {
      for (const texture of Object.values(this.textures)) {
        texture.dispose();
      }
    }

    this.clear();
    this.galaceanMaterial.destroy();

  }
}
