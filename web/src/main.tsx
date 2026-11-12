import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { LEGACY_TAB_PARAM } from './app/routes';
import { registerPwa } from './app/pwa';
// Font tự host: chỉ tải subset cần (latin, vietnamese) nhờ unicode-range
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/jetbrains-mono';
import './index.css';

registerPwa();

// Link cũ dạng ?tab=heatmap -> /#/nhiet
const legacyTab = new URLSearchParams(window.location.search).get('tab');
if (legacyTab && Object.prototype.hasOwnProperty.call(LEGACY_TAB_PARAM, legacyTab) && !window.location.hash) {
  window.history.replaceState(null, '', `${window.location.pathname}#${LEGACY_TAB_PARAM[legacyTab]}`);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
