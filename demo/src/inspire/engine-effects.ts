import { registerPlugin, AbstractPlugin, VFXItem, isWebGL2 } from '@galacean/effects-core';
import { createGalaceanPlayer, renderByGalaceanDisplayComponent } from '../common/galacean-display-component';

// 假装注册陀螺仪插件，兼容有陀螺仪的合成报错
// @ts-expect-error
registerPlugin('orientation-transformer', AbstractPlugin, VFXItem);

const container = document.getElementById('J-container');
let player: any;

window.addEventListener('message', async event => {
  const { type, json, playerOptions } = event.data;

  switch (type) {
    case 'init': {
      player = await createGalaceanPlayer({
        container,
        ...playerOptions,
        onItemClicked: (item: any) => console.info(`item ${item.name} has been clicked`, item),
      });

      break;
    }
    case 'play': {
      console.debug(`engine-effects 渲染模式：${isWebGL2(player.engine._hardwareRenderer.gl) ? 'webgl2' : 'webgl'}`);
      void renderByGalaceanDisplayComponent(player, json);

      break;
    }
    case 'pause': {
      if (player.hasPlayable) {
        player.pause();
      }

      break;
    }
    case 'resume': {
      player.resume();

      break;
    }
  }
});
