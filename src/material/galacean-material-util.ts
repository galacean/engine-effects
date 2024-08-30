import * as ENGINE from '@galacean/engine';
import { glContext } from '@galacean/effects-core';

/**
 * WebGL 中和 blend 相关参数到 Galacean 的常量映射表
 */
export const CONSTANT_MAP_BLEND: Record<string, ENGINE.BlendFactor> = {
  [glContext.ONE]: ENGINE.BlendFactor.One,
  [glContext.ZERO]: ENGINE.BlendFactor.Zero,
  [glContext.SRC_COLOR]: ENGINE.BlendFactor.SourceColor,
  [glContext.SRC_ALPHA]: ENGINE.BlendFactor.SourceAlpha,
  [glContext.ONE_MINUS_SRC_COLOR]: ENGINE.BlendFactor.OneMinusSourceColor,
  [glContext.ONE_MINUS_SRC_ALPHA]: ENGINE.BlendFactor.OneMinusSourceAlpha,
  [glContext.DST_COLOR]: ENGINE.BlendFactor.DestinationColor,
  [glContext.DST_ALPHA]: ENGINE.BlendFactor.DestinationAlpha,
  [glContext.ONE_MINUS_DST_COLOR]: ENGINE.BlendFactor.OneMinusDestinationColor,
  [glContext.ONE_MINUS_DST_ALPHA]: ENGINE.BlendFactor.OneMinusDestinationAlpha,
};

/**
 * WebGL 中和 blend 相关参数到 Galacean 的常量映射表
 */
export const CONSTANT_MAP_BLEND_OPERARION: Record<string, ENGINE.BlendOperation> = {
  [glContext.FUNC_ADD]: ENGINE.BlendOperation.Add,
  [glContext.MAX]: ENGINE.BlendOperation.Max,
  [glContext.MIN]: ENGINE.BlendOperation.Min,
  [glContext.FUNC_SUBTRACT]: ENGINE.BlendOperation.Subtract,
  [glContext.FUNC_REVERSE_SUBTRACT]: ENGINE.BlendOperation.ReverseSubtract,
};

/**
 * WebGL 中和 stencil 相关参数到 Galacean 的常量映射表
 */
export const CONSTANT_MAP_STENCIL_FUNC: Record<string, ENGINE.CompareFunction> = {
  [glContext.NEVER]: ENGINE.CompareFunction.Never,
  [glContext.EQUAL]: ENGINE.CompareFunction.Equal,
  [glContext.LESS]: ENGINE.CompareFunction.Less,
  [glContext.LEQUAL]: ENGINE.CompareFunction.LessEqual,
  [glContext.ALWAYS]: ENGINE.CompareFunction.Always,
  [glContext.NOTEQUAL]: ENGINE.CompareFunction.NotEqual,
  [glContext.GREATER]: ENGINE.CompareFunction.Greater,
  [glContext.GEQUAL]: ENGINE.CompareFunction.GreaterEqual,
};

/**
 * WebGL 中和 stencil 相关测试结果参数到 Galacean 的常量映射表
 */
export const CONSTANT_MAP_STENCIL_OP: Record<string, ENGINE.StencilOperation> = {
  [glContext.KEEP]: ENGINE.StencilOperation.Keep,
  [glContext.ZERO]: ENGINE.StencilOperation.Zero,
  [glContext.REPLACE]: ENGINE.StencilOperation.Replace,
  [glContext.INCR]: ENGINE.StencilOperation.IncrementSaturate,
  [glContext.DECR]: ENGINE.StencilOperation.DecrementSaturate,
  [glContext.INCR_WRAP]: ENGINE.StencilOperation.IncrementWrap,
  [glContext.DECR_WRAP]: ENGINE.StencilOperation.DecrementWrap,
  [glContext.INVERT]: ENGINE.StencilOperation.Invert,
};

/**
 * WebGL 中和 depth 相关参数到 Galacean 的常量映射表
 */
export const CONSTANT_MAP_DEPTH: Record<string, ENGINE.CompareFunction> = {
  [glContext.NEVER]: ENGINE.CompareFunction.Never,
  [glContext.ALWAYS]: ENGINE.CompareFunction.Always,
  [glContext.EQUAL]: ENGINE.CompareFunction.Equal,
  [glContext.LESS]: ENGINE.CompareFunction.Less,
  [glContext.LEQUAL]: ENGINE.CompareFunction.LessEqual,
  [glContext.GREATER]: ENGINE.CompareFunction.Greater,
  [glContext.GEQUAL]: ENGINE.CompareFunction.GreaterEqual,
  [glContext.NOTEQUAL]: ENGINE.CompareFunction.NotEqual,
};
