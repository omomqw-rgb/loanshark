(function (window) {
  'use strict';
  var App = window.App || (window.App = {});
  App.local = App.local || {};

  App.local.save = function () {
    try {
      const data = JSON.stringify(App.state || {}, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app_state_backup.json';
      a.click();
    } catch (err) {
      console.error('[Local Save] Failed:', err);
    }
  };

  App.local.load = async function (file) {
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      App.state = obj;
      if (App.renderAll) App.renderAll();
      console.log('[Local Load] Success');
    } catch (err) {
      console.error('[Local Load] Failed:', err);
    }
  };
})(window);
