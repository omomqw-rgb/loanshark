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
      console.log('[Local Save] Success');
      App.showToast("Local Save 완료 — JSON 파일이 다운로드됩니다.");
    } catch (err) {
      console.error('[Local Save] Failed:', err);
      App.showToast("오류 발생 — 다시 시도해주세요.");
    }
  };

  App.local.load = async function (file) {
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      App.state = obj;
      if (App.renderAll) App.renderAll();
      console.log('[Local Load] Success');
      App.showToast("Local Load 완료 — 로컬 데이터를 적용했습니다.");
    } catch (err) {
      console.error('[Local Load] Failed:', err);
      App.showToast("오류 발생 — 다시 시도해주세요.");
    }
  };
})(window);
