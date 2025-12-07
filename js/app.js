(function (window, document) {
  'use strict';
  var App = window.App || (window.App = {});

  function init() {
    if (App.ui && App.ui.layout && App.ui.layout.init) {
      App.ui.layout.init();
    }
    if (App.ui && App.ui.events && App.ui.events.init) {
      App.ui.events.init();
    }
    if (App.features && App.features.debtors && App.features.debtors.init) {
      App.features.debtors.init();
    }
    if (App.features && App.features.calendar && App.features.calendar.init) {
      App.features.calendar.init();
    }
    if (App.features && App.features.monitoring && App.features.monitoring.init) {
      App.features.monitoring.init();
    }
    if (App.features && App.features.report && App.features.report.init) {
      App.features.report.init();
    }
    if (App.auth && App.auth.init) {
      App.auth.init();
    }

    // Save / Load button bindings
    var localSaveBtn = document.getElementById('local-save-btn');
    if (localSaveBtn && App.local && typeof App.local.save === 'function') {
      localSaveBtn.addEventListener('click', function () {
        App.local.save();
      });
    }

    var localLoadTrigger = document.getElementById('local-load-trigger');
    var localLoadInput = document.getElementById('local-load-file');
    if (localLoadTrigger && localLoadInput && App.local && typeof App.local.load === 'function') {
      localLoadTrigger.addEventListener('click', function () {
        localLoadInput.click();
      });
      localLoadInput.addEventListener('change', function (e) {
        var files = e.target && e.target.files ? e.target.files : null;
        if (files && files.length) {
          App.local.load(files[0]);
        }
      });
    }

    var cloudSaveBtn = document.getElementById('cloud-save-btn');
    if (cloudSaveBtn && App.data && typeof App.data.saveToSupabase === 'function') {
      cloudSaveBtn.addEventListener('click', function () {
        App.data.saveToSupabase();
      });
    }

    var cloudLoadBtn = document.getElementById('cloud-load-btn');
    if (cloudLoadBtn && App.data && typeof App.data.loadAllFromSupabase === 'function') {
      cloudLoadBtn.addEventListener('click', function () {
        App.data.loadAllFromSupabase();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);



// Dummy data injection for v160
(function(){
  window.App = window.App || {};
  App.state = App.state || {};
  App.data = App.data || {};

  const debtors=[];
  for(let i=1;i<=15;i++){
    debtors.push({
      id: String(i),
      userId: "dev",
      name: "테스트채무자" + i,
      phone: "010-"+String(1000+i),
      status: "진행",
      note: "",
      createdAt: "2025-01-"+String((i%28)+1).padStart(2,'0')
    });
  }

  const loans=[];
  const claims=[];
  const schedules=[];

  App.state.debtors = debtors;
  App.state.loans = loans;
  App.state.claims = claims;
  App.state.schedules = schedules;

  if(App.data && typeof App.data.buildDebtorsDetailed === 'function'){
    const bridge = App.data.buildDebtorsDetailed(debtors, loans, claims, schedules);
    App.data.debtors = bridge.list;
    App.data.debtorsDetailed = bridge.byId;
  }

  if(App.debtors && App.debtors.updateFilteredList){
    App.debtors.updateFilteredList();
    App.debtors.renderList();
  }
})();
