import inspireList from '../assets/inspire-list';

const preEffectsPlayerIframe = document.getElementById('J-preEffectsPlayerIframe') as HTMLIFrameElement;
const engineEffectsIframe = document.getElementById('J-engineEffectsIframe') as HTMLIFrameElement;
const engineUseEffectsCameraIframe = document.getElementById('J-engineUseEffectsCameraIframe') as HTMLIFrameElement;
const frameworkEle = document.getElementById('J-framework') as HTMLSelectElement;
const iframeList = [preEffectsPlayerIframe, engineEffectsIframe, engineUseEffectsCameraIframe];
const renderFramework = frameworkEle.value;
const currentTime = 0;
const speed = 1;
const playerOptions = {
  willCaptureImage: true,
  pixelRatio: 2,
  env: 'editor',
  interactive: true,
  renderFramework,
};
let currentInspire = inspireList['ribbons'].url;

initialSelectList();
bindEventListeners();
handleInit();

function bindEventListeners () {
  document.getElementById('J-start')!.onclick = () => {
    handlePause();
    void handlePlay(currentInspire);
  };
  document.getElementById('J-pause')!.onclick = handlePause;
  // 切换 WebGL/WebGL2
  frameworkEle.onchange = () => {
    playerOptions.renderFramework = frameworkEle.value;
    iframeList.forEach(iframe => {
      iframe.contentWindow?.location.reload();
    });
    handleInit();
  };
}

function handleInit () {
  iframeList.forEach(iframe => {
    iframe.onload = () => {
      iframe.contentWindow?.postMessage({
        type: 'init',
        playerOptions,
      });
    };
  });
}

async function handlePlay (animation: string) {
  const json = await (await fetch(animation)).json();

  iframeList.forEach(iframe => {
    iframe.contentWindow?.postMessage({
      type: 'play',
      json,
      currentTime,
      speed,
    });
  });
}

function handleResume () {
  iframeList.forEach(iframe => {
    iframe.contentWindow?.postMessage({
      type: 'resume',
    });
  });
}

function handlePause () {
  iframeList.forEach(iframe => {
    iframe.contentWindow?.postMessage({
      type: 'pause',
    });
  });
}

function initialSelectList () {
  const selectEle = document.getElementById('J-select') as HTMLSelectElement;
  const options: string[] = [];

  Object.entries(inspireList).map(([key, object]) => {
    options.push(
      `<option value="${key}" ${object.name === 'ribbons' ? 'selected' : ''}>
        ${object.name}  ${object.pass ? '✅' : '❌'}
      </option>`
    );
  });
  selectEle.innerHTML = options.join('');
  selectEle.onchange = () => {
    const selected = selectEle.value;

    currentInspire = (inspireList as Record<string, any>)[selected].url;
  };
}

