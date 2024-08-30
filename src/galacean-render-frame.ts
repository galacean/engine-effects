import type { RendererComponent } from '@galacean/effects-core';
import { RenderFrame } from '@galacean/effects-core';

export class GalaceanRenderFrame extends RenderFrame {
  override addMeshToDefaultRenderPass (mesh?: RendererComponent): void {
    mesh?.render(this.renderer);
  }
}
