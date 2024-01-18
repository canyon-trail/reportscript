import { basic, initSidebar, initTopbar } from './modules/layouts';
import {
  loadImg,
  imgPopup,
  initLocaleDatetime,
  initClipboard,
} from './modules/plugins';

initSidebar();
initTopbar();
loadImg();
imgPopup();
initLocaleDatetime();
initClipboard();
basic();
