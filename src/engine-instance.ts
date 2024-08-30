import * as ENGINE from '@galacean/engine';
import type { GalaceanEffectsOptions } from './galacean-display-component';
import { GalaceanDisplayComponent } from './galacean-display-component';

/**
 * 设置全局唯一 Engine 对象
 * @param options
 */
export function setEngine (options?: GalaceanEffectsOptions) {
  GalaceanDisplayComponent.notifyTouch = !options?.notifyTouch;
  /**
   * 必须有这个修改，Effects 的 shader 实现和 Galaecan 不同，
   * 这里面的修改对于 Effects 没什么用，但是又没方法避开不用 Engine 中的方法
   * 需要引擎修改后可以去除
   */
  hackShaderConvert();
}

function hackShaderConvert () {
  ENGINE.ShaderFactory.convertTo300 = function (shader: string, isFrag?: boolean) {
    /** replace attribute and in */
    shader = shader.replace(/\battribute\b/g, 'in');
    shader = shader.replace(/\bvarying\b/g, isFrag ? 'in' : 'out');

    /** replace api */
    shader = shader.replace(/\btexture(2D|Cube)\b/g, 'texture');
    shader = shader.replace(/\btexture(2D|Cube)LodEXT\b/g, 'textureLod');
    if (isFrag) {

      const isMRT = /\bgl_FragData\[.+?\]/g.test(shader);

      if (isMRT) {
        shader = shader.replace(/\bgl_FragColor\b/g, 'gl_FragData[0]');
        const result = shader.match(/\bgl_FragData\[.+?\]/g);

        // @ts-expect-error
        shader = this._replaceMRTShader(shader, result);
      } else {

        if (!shader.includes('MARS_RUNTIME') || shader.includes('vDark')) {
          shader = shader.replace(/void\s+?main\s*\(/g, 'out vec4 glFragColor;\nvoid main(');
        }
        shader = shader.replace(/\bgl_FragColor\b/g, 'glFragColor');
      }
    }

    return shader;
  };
}
