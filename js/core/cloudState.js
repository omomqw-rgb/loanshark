(function (window) {
  'use strict';

  var App = window.App || (window.App = {});
  var util = App.util || {};

  function getTodayISODate() {
    if (util && typeof util.todayISODate === 'function') {
      return util.todayISODate();
    }
    var d = new Date();
    if (isNaN(d.getTime())) return '';
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    var mm = m < 10 ? '0' + m : String(m);
    var dd = day < 10 ? '0' + day : String(day);
    return y + '-' + mm + '-' + dd;
  }

  function pickArray(primary, fallback) {
    if (primary && primary.length) return primary;
    if (fallback && fallback.length) return fallback;
    return [];
  }

  App.cloudState = App.cloudState || {};

  // Cloud에 저장할 전체 스냅샷을 만드는 함수
  App.cloudState.build = function () {
    var state = App.state || {};
    var uiState = state.ui || {};
    var calendar = uiState.calendar || {};
    var debtorPanel = uiState.debtorPanel || {};

    var dataRoot = App.data || {};
    var stateData = state || {};

    var snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      appVersion: (App.meta && App.meta.version) || 'v325',

      ui: {
        calendar: {
          view: calendar.view || 'month',
          sortMode: calendar.sortMode || 'type',
          currentDate: calendar.currentDate || getTodayISODate()
        },
        activeTab: uiState.activeTab || 'calendar',
        debtorPanel: {
          mode: debtorPanel.mode || 'list',
          page: typeof debtorPanel.page === 'number' ? debtorPanel.page : 1,
          searchQuery: debtorPanel.searchQuery || '',
          selectedDebtorId: (typeof debtorPanel.selectedDebtorId === 'undefined')
            ? null
            : debtorPanel.selectedDebtorId
        }
      },

      data: {
        debtors: pickArray(dataRoot.debtors, stateData.debtors),
        loans: pickArray(dataRoot.loans, stateData.loans),
        claims: pickArray(dataRoot.claims, stateData.claims),
        schedules: pickArray(dataRoot.schedules, stateData.schedules),
        cashLogs: pickArray(dataRoot.cashLogs, stateData.cashLogs),
        riskSettings: (typeof dataRoot.riskSettings !== 'undefined')
          ? dataRoot.riskSettings
          : (typeof App.riskSettings !== 'undefined' ? App.riskSettings : null)
      }
    };

    snapshot.data.cashLogs = snapshot.data.cashLogs || [];
    if (typeof snapshot.data.riskSettings === 'undefined') {
      snapshot.data.riskSettings = null;
    }

    return snapshot;
  };

  // Supabase에서 가져온 스냅샷을 앱에 반영하는 함수
  App.cloudState.apply = function (snapshot) {
    if (!snapshot || snapshot.version !== 1) {
      console.warn('[CloudState] Unsupported or missing snapshot. Resetting to empty state.');

      if (!App.data) App.data = {};
      App.data.debtors = [];
      App.data.loans = [];
      App.data.claims = [];
      App.data.schedules = [];
      App.data.cashLogs = [];
      App.data.riskSettings = null;

      if (!App.state) App.state = {};
      App.state.debtors = [];
      App.state.loans = [];
      App.state.claims = [];
      App.state.schedules = [];
      App.state.cashLogs = [];

      var todayISO = getTodayISODate();

      App.state.ui = App.state.ui || {};
      App.state.ui.calendar = App.state.ui.calendar || {};
      App.state.ui.calendar.view = 'week';
      App.state.ui.calendar.sortMode = 'type';
      App.state.ui.calendar.currentDate = todayISO;

      App.state.ui.activeTab = App.state.ui.activeTab || 'calendar';

      App.state.ui.debtorPanel = App.state.ui.debtorPanel || {};
      App.state.ui.debtorPanel.mode = 'list';
      App.state.ui.debtorPanel.page = 1;
      App.state.ui.debtorPanel.searchQuery = '';
      App.state.ui.debtorPanel.selectedDebtorId = null;

      return;
    }

    var data = snapshot.data || {};
    if (!App.data) App.data = {};

    App.data.debtors = data.debtors || [];
    App.data.loans = data.loans || [];
    App.data.claims = data.claims || [];
    App.data.schedules = data.schedules || [];
    App.data.cashLogs = data.cashLogs || [];
    App.data.riskSettings = (typeof data.riskSettings !== 'undefined') ? data.riskSettings : null;

    if (!App.state) App.state = {};
    App.state.ui = App.state.ui || {};

    var ui = snapshot.ui || {};
    var cal = ui.calendar || {};
    var debtorPanel = ui.debtorPanel || {};
    var todayISO2 = getTodayISODate();

    App.state.ui.calendar = App.state.ui.calendar || {};
    App.state.ui.calendar.view = cal.view || 'week';
    App.state.ui.calendar.sortMode = cal.sortMode || 'type';
    App.state.ui.calendar.currentDate = cal.currentDate || todayISO2;

    App.state.ui.activeTab = ui.activeTab || 'calendar';

    App.state.ui.debtorPanel = App.state.ui.debtorPanel || {};
    App.state.ui.debtorPanel.mode = debtorPanel.mode || 'list';
    App.state.ui.debtorPanel.page = (typeof debtorPanel.page === 'number') ? debtorPanel.page : 1;
    App.state.ui.debtorPanel.searchQuery = debtorPanel.searchQuery || '';
    App.state.ui.debtorPanel.selectedDebtorId =
      (typeof debtorPanel.selectedDebtorId === 'undefined') ? null : debtorPanel.selectedDebtorId;

    if (typeof App.data.riskSettings !== 'undefined') {
      App.riskSettings = App.data.riskSettings;
    }
  };
})(window);