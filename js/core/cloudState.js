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

  function isObject(v) {
    return v && typeof v === 'object';
  }

  function toStr(v) {
    if (v === null || typeof v === 'undefined') return v;
    return String(v);
  }

  function shallowClone(obj) {
    if (!isObject(obj)) return obj;
    var out = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        out[k] = obj[k];
      }
    }
    return out;
  }

  function cloneArray(arr) {
    var out = [];
    if (!arr || !arr.length) return out;
    for (var i = 0; i < arr.length; i++) {
      var item = arr[i];
      out.push(isObject(item) ? shallowClone(item) : item);
    }
    return out;
  }

  function normalizeLoanIdsInPlace(loans) {
    loans = loans || [];
    for (var i = 0; i < loans.length; i++) {
      var l = loans[i];
      if (!isObject(l)) continue;

      // snake_case compatibility
      if (typeof l.debtorId === 'undefined' && typeof l.debtor_id !== 'undefined') {
        l.debtorId = l.debtor_id;
      }

      if (l.id != null) l.id = toStr(l.id);
      if (l.debtorId != null) l.debtorId = toStr(l.debtorId);

      if (typeof l.debtor_id !== 'undefined') l.debtor_id = l.debtorId;
    }
  }

  function normalizeClaimIdsInPlace(claims) {
    claims = claims || [];
    for (var i = 0; i < claims.length; i++) {
      var c = claims[i];
      if (!isObject(c)) continue;

      // snake_case compatibility
      if (typeof c.debtorId === 'undefined' && typeof c.debtor_id !== 'undefined') {
        c.debtorId = c.debtor_id;
      }

      if (c.id != null) c.id = toStr(c.id);
      if (c.debtorId != null) c.debtorId = toStr(c.debtorId);

      if (typeof c.debtor_id !== 'undefined') c.debtor_id = c.debtorId;
    }
  }

  function normalizeDebtorIdsInPlace(debtors) {
    debtors = debtors || [];
    for (var i = 0; i < debtors.length; i++) {
      var d = debtors[i];
      if (!isObject(d)) continue;

      // snake_case compatibility
      if (typeof d.id === 'undefined' && typeof d.debtor_id !== 'undefined') {
        d.id = d.debtor_id;
      }

      if (d.id != null) d.id = toStr(d.id);
      if (typeof d.debtor_id !== 'undefined') d.debtor_id = d.id;
    }
  }

  function normalizeScheduleIdsInPlace(schedules) {
    schedules = schedules || [];
    for (var i = 0; i < schedules.length; i++) {
      var s = schedules[i];
      if (!isObject(s)) continue;

      // snake_case compatibility (legacy rows, etc.)
      if (typeof s.loanId === 'undefined' && typeof s.loan_id !== 'undefined') {
        s.loanId = s.loan_id;
      }
      if (typeof s.claimId === 'undefined' && typeof s.claim_id !== 'undefined') {
        s.claimId = s.claim_id;
      }
      if (typeof s.debtorId === 'undefined' && typeof s.debtor_id !== 'undefined') {
        s.debtorId = s.debtor_id;
      }

      if (s.id != null) s.id = toStr(s.id);
      if (s.loanId != null) s.loanId = toStr(s.loanId);
      if (s.claimId != null) s.claimId = toStr(s.claimId);
      if (s.debtorId != null) s.debtorId = toStr(s.debtorId);

      if (typeof s.loan_id !== 'undefined') s.loan_id = s.loanId;
      if (typeof s.claim_id !== 'undefined') s.claim_id = s.claimId;
      if (typeof s.debtor_id !== 'undefined') s.debtor_id = s.debtorId;
    }
  }

  function normalizeAppDataIds(data) {
    if (!data) return;
    normalizeDebtorIdsInPlace(data.debtors);
    normalizeLoanIdsInPlace(data.loans);
    normalizeClaimIdsInPlace(data.claims);
    normalizeScheduleIdsInPlace(data.schedules);
  }

  function collectTypeStats(list, field) {
    var stats = Object.create(null);
    if (!list || !list.length) return stats;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (!isObject(item)) continue;
      var v = item[field];
      var t = (v === null) ? 'null' : typeof v;
      stats[t] = (stats[t] || 0) + 1;
    }
    return stats;
  }

  function runShadowQA(source) {
    source = source || 'unknown';

    var loans = (App.data && App.data.loans) || (App.state && App.state.loans) || [];
    var claims = (App.data && App.data.claims) || (App.state && App.state.claims) || [];
    var schedules = (App.data && App.data.schedules) || (App.state && App.state.schedules) || [];

    var loanById = Object.create(null);
    var claimById = Object.create(null);
    var scheduleCountByLoan = Object.create(null);

    for (var i = 0; i < loans.length; i++) {
      var loan = loans[i];
      if (!loan || loan.id == null) continue;
      loanById[String(loan.id)] = loan;
    }

    for (var j = 0; j < claims.length; j++) {
      var claim = claims[j];
      if (!claim || claim.id == null) continue;
      claimById[String(claim.id)] = claim;
    }

    var orphanLoanSchedules = 0;
    var orphanClaimSchedules = 0;

    for (var k = 0; k < schedules.length; k++) {
      var sc = schedules[k];
      if (!sc || !sc.kind) continue;

      if (sc.kind === 'loan') {
        var lid = (typeof sc.loanId !== 'undefined') ? sc.loanId : sc.loan_id;
        if (lid == null) continue;
        var lidKey = String(lid);
        scheduleCountByLoan[lidKey] = (scheduleCountByLoan[lidKey] || 0) + 1;
        if (!loanById[lidKey]) orphanLoanSchedules++;
      } else if (sc.kind === 'claim') {
        var cid = (typeof sc.claimId !== 'undefined') ? sc.claimId : sc.claim_id;
        if (cid == null) continue;
        var cidKey = String(cid);
        if (!claimById[cidKey]) orphanClaimSchedules++;
      }
    }

    var missingLoanScheduleIds = [];
    for (var loanId in loanById) {
      if (!Object.prototype.hasOwnProperty.call(loanById, loanId)) continue;
      if (!scheduleCountByLoan[loanId]) missingLoanScheduleIds.push(loanId);
    }

    var report = {
      source: source,
      loansTotal: Object.keys(loanById).length,
      schedulesTotal: schedules.length,
      loansMissingSchedules: missingLoanScheduleIds,
      orphanLoanSchedules: orphanLoanSchedules,
      orphanClaimSchedules: orphanClaimSchedules,
      typeStats: {
        loanId: collectTypeStats(loans, 'id'),
        scheduleLoanId: collectTypeStats(schedules, 'loanId'),
        scheduleLoan_id: collectTypeStats(schedules, 'loan_id')
      }
    };

    App.cloudState = App.cloudState || {};
    App.cloudState.lastShadowQA = report;

    if (missingLoanScheduleIds.length || orphanLoanSchedules || orphanClaimSchedules) {
      console.warn('[ShadowQA] schedule link check found issues:', report);
    } else {
      console.log('[ShadowQA] schedule link check OK:', report);
    }

    return report;
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

    // IMPORTANT:
    // - Supabase JSONB save/load 과정에서 id 필드(loan.id / schedule.loanId 등)가 number/string 혼재될 수 있고,
    //   이후 strict 비교(===)로 매핑이 실패하면 특정 Loan의 스케쥴이 "없음"으로 보이는 문제가 발생한다.
    // - v326에서는 build/apply 양쪽에서 id 필드를 string 기반으로 정규화해 저장/복원한다.

    var snapshotData = {
      debtors: cloneArray(pickArray(dataRoot.debtors, stateData.debtors)),
      loans: cloneArray(pickArray(dataRoot.loans, stateData.loans)),
      claims: cloneArray(pickArray(dataRoot.claims, stateData.claims)),
      schedules: cloneArray(pickArray(dataRoot.schedules, stateData.schedules)),
      cashLogs: cloneArray(pickArray(dataRoot.cashLogs, stateData.cashLogs)),
      riskSettings: (typeof dataRoot.riskSettings !== 'undefined')
        ? dataRoot.riskSettings
        : (typeof App.riskSettings !== 'undefined' ? App.riskSettings : null)
    };

    normalizeAppDataIds(snapshotData);

    var snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      appVersion: (App.meta && App.meta.version) || 'v326_schedule_cloudload_bugfix',

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

      data: snapshotData
    };

    snapshot.data.cashLogs = snapshot.data.cashLogs || [];
    if (typeof snapshot.data.riskSettings === 'undefined') {
      snapshot.data.riskSettings = null;
    }

    return snapshot;
  };

  /**
   * CloudState.load
   *
   * Supabase에서 가져온 snapshot 객체를 검증하고,
   * 유효한 경우에만 CloudState.apply를 통해 전체 상태를 교체한다.
   *
   * - snapshot.version === 1 인 경우만 지원
   * - snapshot.data 가 object 가 아니면 적용하지 않음
   * - 여기서는 App.state / App.data 를 임의로 건드리지 않고,
   *   실제 데이터 교체는 apply() 에서만 수행한다.
   *
   * @param {{Object}} snapshot Supabase app_states.state 필드에서 읽어온 객체
   * @returns {{ applied: boolean, reason: string, version: any }}
   */
  App.cloudState.load = function (snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      console.warn('[CloudState] load() called with empty or non-object snapshot.');
      return { applied: false, reason: 'empty', version: null };
    }

    var version = snapshot && snapshot.version;
    var isV1 = (version === 1 || version === '1');
    var hasDataObject = !!(snapshot.data && typeof snapshot.data === 'object');

    if (!isV1 || !hasDataObject) {
      console.warn('[CloudState] Unsupported snapshot version or shape. Skipping apply.', {
        version: version,
        hasData: hasDataObject
      });
      return { applied: false, reason: 'unsupported', version: version };
    }

    if (!App.data) App.data = {};
    if (!App.state) App.state = {};
    if (!App.state.ui) App.state.ui = {};

    // 실제 스냅샷 적용은 apply()에서만 수행한다.
    App.cloudState.apply(snapshot);

    return { applied: true, reason: 'applied', version: version };
  };

  // Supabase에서 가져온 스냅샷을 앱에 반영하는 함수
  App.cloudState.apply = function (snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      console.warn('[CloudState] apply() called with invalid snapshot. Ignoring.');
      return;
    }

    var data = snapshot.data || {};
    var ui = snapshot.ui || {};

    if (!App.data) App.data = {};
    if (!App.state) App.state = {};
    if (!App.state.ui) App.state.ui = {};

    // 1) 데이터 루트 교체 (기존 데이터는 완전히 대체)
    App.data.debtors = Array.isArray(data.debtors) ? cloneArray(data.debtors) : [];
    App.data.loans = Array.isArray(data.loans) ? cloneArray(data.loans) : [];
    App.data.claims = Array.isArray(data.claims) ? cloneArray(data.claims) : [];
    App.data.schedules = Array.isArray(data.schedules) ? cloneArray(data.schedules) : [];
    App.data.cashLogs = Array.isArray(data.cashLogs) ? cloneArray(data.cashLogs) : [];

    if (typeof data.riskSettings !== 'undefined') {
      App.data.riskSettings = isObject(data.riskSettings)
        ? shallowClone(data.riskSettings)
        : data.riskSettings;
    } else {
      App.data.riskSettings = null;
    }

    // 2) Loan / Claim / Schedule / Debtor ID 정규화
    normalizeAppDataIds(App.data);

    // 3) UI 상태 복원
    var calendar = ui.calendar || {};
    var debtorPanel = ui.debtorPanel || {};
    var todayISO = getTodayISODate();

    App.state.ui.calendar = App.state.ui.calendar || {};
    App.state.ui.calendar.view = calendar.view || 'week';
    App.state.ui.calendar.sortMode = calendar.sortMode || 'type';
    App.state.ui.calendar.currentDate = calendar.currentDate || todayISO;

    App.state.ui.activeTab = ui.activeTab || 'calendar';

    App.state.ui.debtorPanel = App.state.ui.debtorPanel || {};
    App.state.ui.debtorPanel.mode = debtorPanel.mode || 'list';
    App.state.ui.debtorPanel.page =
      (typeof debtorPanel.page === 'number') ? debtorPanel.page : 1;
    App.state.ui.debtorPanel.searchQuery = debtorPanel.searchQuery || '';
    App.state.ui.debtorPanel.selectedDebtorId =
      (typeof debtorPanel.selectedDebtorId === 'undefined')
        ? null
        : debtorPanel.selectedDebtorId;

    if (typeof App.data.riskSettings !== 'undefined') {
      App.riskSettings = App.data.riskSettings;
    }

    // ShadowQA: Cloud Load 이후 Loan ↔ Schedule 매핑 무결성 체크 (콘솔 경고/리포트 저장)
    runShadowQA('cloudState.apply');
  };

  // Manual QA hook (optional)
  App.cloudState.runShadowQA = function () {
    return runShadowQA('manual');
  };
})(window);
