//@ts-nocheck
const container = document.getElementById('J-container');
let player;

window.addEventListener('message', async event => {
  const { type, json, playerOptions } = event.data;

  switch (type) {
    case 'init': {
      player = new window.ge.Player({
        container,
        ...playerOptions,
        onItemClicked: item => console.info(`item ${item.name} has been clicked`, item),
      });

      break;
    }
    case 'play': {
      player.destroyCurrentCompositions();
      await player.loadScene(json);

      console.debug(`pre-effects-player 渲染模式：${player.renderer.engine.gpuCapability.type}`);

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
