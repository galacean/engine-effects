import type { Camera } from '@galacean/effects-core';
import { Renderer } from '@galacean/effects-core';
import type { GalaceanEngine } from './galacean-engine';

export class GalaceanRenderer extends Renderer {
  // fix env is undefined
  override env = '';
  effectsCamera: Camera;

  constructor (engine: GalaceanEngine) {
    super();

    this.engine = engine;
    this.renderingData = {
      currentFrame: {
        // @ts-expect-error
        globalUniforms: {},
      },
    };
  }

  setEffectsCamera (camera: Camera): void {
    this.effectsCamera = camera;
  }
}
