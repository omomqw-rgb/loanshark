(function (window, document) {
  'use strict';

  var App = window.App || (window.App = window.App || {});
  App.features = App.features || {};

  // 핸들러: js/features/debtors.js 에서 분리
  function findDebtor(id) {
    var state = App.state || {};
    var list = state.debtors || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  function findLoan(id) {
    var state = App.state || {};
    var list = state.loans || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  function findClaim(id) {
    var state = App.state || {};
    var list = state.claims || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }


  function handleDebtorCreate(form) {
      var api = App.features && App.features.debtors;

      var nameInput = form.querySelector('[name="debtor-name"]');
      var noteInput = form.querySelector('[name="debtor-note"]');

      var name = nameInput ? nameInput.value.trim() : '';
      var note = noteInput ? noteInput.value.trim() : '';

      if (!name) {
        alert('이름을 입력하세요.');
        return;
      }

      if (!App.state) App.state = {};
      if (!App.state.debtors) App.state.debtors = [];
      var debtors = App.state.debtors;

      var newId = 'D' + String(debtors.length + 1).padStart(3, '0');
      var today = new Date().toISOString().slice(0, 10);

      var newDebtor = {
        id: newId,
        name: name,
        createdAt: today,
        note: note
      };

      debtors.push(newDebtor);

      if (!App.data) App.data = {};
      if (!App.data.debtors) App.data.debtors = [];
      if (!App.data.debtorsDetailed) App.data.debtorsDetailed = {};

      var debtorDetail = {
        id: newId,
        name: name,
        note: note,
        created: today,
        loanCount: 0,
        claimCount: 0,
        loanTotal: 0,
        claimTotal: 0,
        overdueAmount: 0,
        loans: [],
        claims: []
      };

      App.data.debtors.push(debtorDetail);
      App.data.debtorsDetailed[String(newId)] = debtorDetail;

      if (App.state.ui && App.state.ui.debtorPanel) {
        App.state.ui.debtorPanel.mode = 'detail';
        App.state.ui.debtorPanel.selectedDebtorId = newId;
        App.state.ui.debtorPanel.page = 1;
      }

      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(newId));
      }
    }

function handleDebtorEdit(form) {
      var api = App.features && App.features.debtors;
      var id = form.getAttribute('data-debtor-id');
      var debtor = findDebtor(id);
      if (!debtor) {
        if (App.modalManager && typeof App.modalManager.close === 'function') {
          App.modalManager.close();
        }
        return;
      }

      function getValue(selector) {
        var input = form.querySelector(selector);
        return input ? input.value.trim() : '';
      }

      var name = getValue('[name="debtor-name"]');
      var phone = getValue('[name="debtor-phone"]');
      var gender = getValue('[name="debtor-gender"]');
      var birth = getValue('[name="debtor-birth"]');
      var region = getValue('[name="debtor-region"]');
      var job = getValue('[name="debtor-job"]');
      var note = getValue('[name="debtor-note"]');
      var manualTier = getValue('[name="debtor-riskTier-manual"]');

      if (!name) {
        alert('이름을 입력하세요.');
        return;
      }

      var autoTier = debtor.riskTierAuto || debtor.riskTier || '';
      if (!autoTier) {
        autoTier = 'B';
      }

      var finalTier = manualTier || autoTier || 'B';

      debtor.name = name;
      debtor.phone = phone;
      debtor.gender = gender;
      debtor.birth = birth;
      debtor.region = region;
      debtor.job = job;
      debtor.note = note;
      debtor.riskTierAuto = autoTier;
      debtor.riskTierManual = manualTier || '';
      debtor.riskTier = finalTier;

      if (App.data && App.data.debtorsDetailed) {
        var key = String(id);
        var detail = App.data.debtorsDetailed[key];
        if (detail) {
          detail.name = debtor.name;
          detail.phone = debtor.phone;
          detail.note = debtor.note;
          detail.gender = debtor.gender;
          detail.birth = debtor.birth;
          detail.region = debtor.region;
          detail.job = debtor.job;
          detail.riskTierAuto = debtor.riskTierAuto;
          detail.riskTierManual = debtor.riskTierManual;
          detail.riskTier = debtor.riskTier;
        }
      }

      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(id));
      }
    }

function handleDebtorDelete() {
      var api = App.features && App.features.debtors;
      var debtor = api && typeof api.getSelectedDebtor === 'function' ? api.getSelectedDebtor() : null;
      if (!debtor) return;
      if (!window.confirm('채무자를 삭제하면 관련 대출·채권 카드도 함께 삭제됩니다. 계속할까요?')) return;
      var id = debtor.id;
      var state = App.state;
      state.debtors = state.debtors.filter(function (d) { return d.id !== id; });
      state.loans = state.loans.filter(function (loan) { return loan.debtorId !== id; });
      state.claims = state.claims.filter(function (claim) { return claim.debtorId !== id; });
      state.schedules = state.schedules.filter(function (s) {
        return !(s.debtorId === id);
      });
      App.state.ui.debtorPanel.mode = 'list';
      App.state.ui.debtorPanel.selectedDebtorId = null;
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (App.data && App.data.debtors && App.data.debtorsDetailed) {
        App.data.debtors = App.data.debtors.filter(function (d) { return d.id !== id; });
        delete App.data.debtorsDetailed[String(id)];
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.clearIfMatches === 'function') {
        App.debtorDetail.clearIfMatches(String(id));
      }
    }

  function handleLoanCreate(form) {
      var api = App.features && App.features.debtors;
      var debtorId = form.getAttribute('data-debtor-id');
      if (!debtorId) return;
  
      var principal = Number(form.querySelector('[name="loan-principal"]').value || 0);
      var rate = Number(form.querySelector('[name="loan-rate"]').value || 0);
      var total = Number(form.querySelector('[name="loan-total"]').value || 0);
      var count = Number(form.querySelector('[name="loan-count"]').value || 1);
      var cycleType = form.querySelector('[name="loan-cycle-type"]').value || 'day';
      var dayInterval = Number(form.querySelector('[name="loan-day-interval"]').value || 7);
      var weekDayStr = form.querySelector('[name="loan-weekday"]').value;
      var weekDay = weekDayStr === '' ? null : Number(weekDayStr);
      var startDate = form.querySelector('[name="loan-start-date"]').value || new Date().toISOString().slice(0, 10);
  
      if (!principal) {
        alert('원금을 입력하세요.');
        return;
      }
      if (!total) {
        alert('원리금을 입력하세요.');
        return;
      }
      if (!count || count < 1) {
        alert('회차 수를 1 이상으로 입력하세요.');
        return;
      }
  
      var state = App.state;
      var loans = state.loans || (state.loans = []);
      var newId = 'L' + String(loans.length + 1).padStart(3, '0');
  
      var loan = {
        id: newId,
        debtorId: debtorId,
        principal: principal,
        interestRate: rate,
        totalRepayAmount: total,
        installmentCount: count,
        cycleType: cycleType,
        dayInterval: dayInterval,
        weekDay: weekDay,
        startDate: startDate
      };
  
      loans.push(loan);
  
      if (!state.schedules) state.schedules = [];
  
      if (App.db && App.db.rebuildSchedulesForLoan) {
        App.db.rebuildSchedulesForLoan(newId);
      }
  
      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(debtorId));
      }
    }

  function handleLoanEdit(form) {
      var api = App.features && App.features.debtors;
      var loanId = form.getAttribute('data-loan-id');
      var loan = findLoan(loanId);
      if (!loan) {
        if (App.modalManager && typeof App.modalManager.close === 'function') {
          App.modalManager.close();
        }
        return;
      }
  
      var principal = Number(form.querySelector('[name="loan-principal"]').value || 0);
      var rate = Number(form.querySelector('[name="loan-rate"]').value || 0);
      var total = Number(form.querySelector('[name="loan-total"]').value || 0);
      var count = Number(form.querySelector('[name="loan-count"]').value || 1);
      var cycleType = form.querySelector('[name="loan-cycle-type"]').value || 'day';
      var dayInterval = Number(form.querySelector('[name="loan-day-interval"]').value || 7);
      var weekDayStr = form.querySelector('[name="loan-weekday"]').value;
      var weekDay = weekDayStr === '' ? null : Number(weekDayStr);
      var startDate = form.querySelector('[name="loan-start-date"]').value || new Date().toISOString().slice(0, 10);
  
      if (!principal) {
        alert('원금을 입력하세요.');
        return;
      }
      if (!total) {
        alert('원리금을 입력하세요.');
        return;
      }
      if (!count || count < 1) {
        alert('회차 수를 1 이상으로 입력하세요.');
        return;
      }
  
      loan.principal = principal;
      loan.interestRate = rate;
      loan.totalRepayAmount = total;
      loan.installmentCount = count;
      loan.cycleType = cycleType;
      loan.dayInterval = dayInterval;
      loan.weekDay = weekDay;
      loan.startDate = startDate;
  
      if (App.db && App.db.rebuildSchedulesForLoan) {
        App.db.rebuildSchedulesForLoan(loanId);
      }
  
      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(loan.debtorId));
      }
    }

  function handleLoanDelete(loanId) {
      var api = App.features && App.features.debtors;
      var loan = findLoan(loanId);
      if (!loan) return;
      var debtorId = loan.debtorId;
      if (!window.confirm('대출 카드를 삭제할까요?')) return;
      var state = App.state;
      state.loans = state.loans.filter(function (l) { return l.id !== loanId; });
      state.schedules = state.schedules.filter(function (s) {
        return !(s.kind === 'loan' && s.loanId === loanId);
      });
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(debtorId));
      }
    }

  function handleClaimCreate(form) {
      var api = App.features && App.features.debtors;
      var debtorId = form.getAttribute('data-debtor-id');
      if (!debtorId) return;
  
      var amount = Number(form.querySelector('[name="claim-amount"]').value || 0);
      var count = Number(form.querySelector('[name="claim-count"]').value || 1);
      var startDate = form.querySelector('[name="claim-start-date"]').value || new Date().toISOString().slice(0, 10);
      var cycleType = form.querySelector('[name="claim-cycle-type"]').value || 'day';
      var dayInterval = Number(form.querySelector('[name="claim-day-interval"]').value || 7);
      var weekDayStr = form.querySelector('[name="claim-weekday"]').value;
      var weekDay = weekDayStr === '' ? null : Number(weekDayStr);
      var memo = form.querySelector('[name="claim-memo"]') ? form.querySelector('[name="claim-memo"]').value : '';
  
      if (!amount) {
        alert('채권금을 입력하세요.');
        return;
      }
      if (!count || count < 1) {
        alert('회차 수를 1 이상으로 입력하세요.');
        return;
      }
  
      var state = App.state;
      var claims = state.claims || (state.claims = []);
      var newId = 'C' + String(claims.length + 1).padStart(3, '0');
  
      var claim = {
        id: newId,
        debtorId: debtorId,
        amount: amount,
        installmentCount: count,
        startDate: startDate,
        cycleType: cycleType,
        dayInterval: dayInterval,
        weekDay: weekDay,
        createdAt: startDate,
        memo: memo
      };
  
      claims.push(claim);
  
      if (App.data && App.data.debtorsDetailed) {
        var dId2 = String(debtorId);
        var dd2 = App.data.debtorsDetailed[dId2];
        if (dd2) {
          if (!dd2.claims) dd2.claims = [];
          dd2.claims.push({
            id: newId,
            amount: amount,
            installmentCount: count,
            startDate: startDate,
            cycleType: cycleType,
            dayInterval: dayInterval,
            weekDay: weekDay,
            memo: memo
          });
        }
      }
  
      if (!state.schedules) state.schedules = [];
  
      if (App.db && App.db.rebuildSchedulesForClaim) {
        App.db.rebuildSchedulesForClaim(newId);
      }
  
      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(debtorId));
      }
    }

  function handleClaimEdit(form) {
      var api = App.features && App.features.debtors;
      var claimId = form.getAttribute('data-claim-id');
      var claim = findClaim(claimId);
      if (!claim) {
        if (App.modalManager && typeof App.modalManager.close === 'function') {
          App.modalManager.close();
        }
        return;
      }
  
      var amount = Number(form.querySelector('[name="claim-amount"]').value || 0);
      var count = Number(form.querySelector('[name="claim-count"]').value || 1);
      var startDate = form.querySelector('[name="claim-start-date"]').value || new Date().toISOString().slice(0, 10);
      var cycleType = form.querySelector('[name="claim-cycle-type"]').value || 'day';
      var dayInterval = Number(form.querySelector('[name="claim-day-interval"]').value || 7);
      var weekDayStr = form.querySelector('[name="claim-weekday"]').value;
      var weekDay = weekDayStr === '' ? null : Number(weekDayStr);
      var memo = form.querySelector('[name="claim-memo"]') ? form.querySelector('[name="claim-memo"]').value : '';
  
      if (!amount) {
        alert('채권금을 입력하세요.');
        return;
      }
      if (!count || count < 1) {
        alert('회차 수를 1 이상으로 입력하세요.');
        return;
      }
  
      var debtorId = claim.debtorId;
  
      claim.amount = amount;
      claim.installmentCount = count;
      claim.startDate = startDate;
      claim.cycleType = cycleType;
      claim.dayInterval = dayInterval;
      claim.weekDay = weekDay;
      claim.memo = memo;
  
      if (App.db && App.db.rebuildSchedulesForClaim) {
        App.db.rebuildSchedulesForClaim(claimId);
      }
  
      if (App.modalManager && typeof App.modalManager.close === 'function') {
        App.modalManager.close();
      }
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(debtorId));
      }
    }

  function handleClaimDelete(claimId) {
      var api = App.features && App.features.debtors;
      var claim = findClaim(claimId);
      if (!claim) return;
      var debtorId = claim.debtorId;
      if (!window.confirm('채권 카드를 삭제할까요?')) return;
      var state = App.state;
      state.claims = state.claims.filter(function (c) { return c.id !== claimId; });
      state.schedules = state.schedules.filter(function (s) {
        return !(s.kind === 'claim' && s.claimId === claimId);
      });
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
        App.debtorDetail.render(String(debtorId));
      }
    }

    function handleLoanScheduleSave(form) {
    var api = App.features && App.features.debtors;
    var loanId = form.getAttribute('data-loan-id');
    var state = App.state;
    var schedules = state.schedules || [];

    // 1단계: 상태(select)를 기준으로 status 및 금액 기본값 설정
    var selects = form.querySelectorAll('select[data-schedule-id]');
    for (var i = 0; i < selects.length; i++) {
      var sel = selects[i];
      var sid = sel.getAttribute('data-schedule-id');
      var val = sel.value || 'PLANNED';

      for (var j = 0; j < schedules.length; j++) {
        if (schedules[j].id === sid) {
          var sc = schedules[j];
          var amount = Number(sc.amount) || 0;

          sc.status = val;

          if (val === 'PAID') {
            sc.paidAmount = amount;
            sc.partialPaidAmount = 0;
          } else if (val === 'PLANNED' || val === 'OVERDUE') {
            sc.paidAmount = 0;
            sc.partialPaidAmount = 0;
          } else if (val === 'PARTIAL') {
            // PARTIAL 은 이 단계에서는 status 만 설정하고 금액은 건드리지 않는다.
          }

          break;
        }
      }
    }

    // 2단계: 부분납 입력값을 기준으로 partialPaidAmount / paidAmount 동기화
    var partialInputs = form.querySelectorAll('input[data-partial-id]');
    for (var k = 0; k < partialInputs.length; k++) {
      var input = partialInputs[k];
      var sid2 = input.getAttribute('data-partial-id');
      var raw = input.value != null ? String(input.value).trim() : '';
      var num = raw === '' ? 0 : Number(raw);
      if (!isFinite(num) || num < 0) num = 0;

      for (var m = 0; m < schedules.length; m++) {
        if (schedules[m].id === sid2) {
          var sc2 = schedules[m];
          sc2.partialPaidAmount = num;
          if ((sc2.status || '').toUpperCase() === 'PARTIAL') {
            sc2.paidAmount = num;
          }
          break;
        }
      }
    }

    if (App.db && App.db.deriveLoanFields) {
      var loan = findLoan(loanId);
      if (loan) {
        var loanSchedules = schedules.filter(function (s) {
          return s.kind === 'loan' && s.loanId === loanId;
        });
        App.db.deriveLoanFields(loan, loanSchedules);
      }
    }

    if (App.modalManager && typeof App.modalManager.close === 'function') {
      App.modalManager.close();
    }
    if (api && typeof api.render === 'function') {
      api.render();
    }
    if (api && typeof api.refreshOtherViews === 'function') {
      api.refreshOtherViews();
    }
    if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
      var loan2 = findLoan(loanId);
      if (loan2) {
        App.debtorDetail.render(String(loan2.debtorId));
      }
    }
  }


  function handleClaimScheduleSave(form) {
    var api = App.features && App.features.debtors;
    var claimId = form.getAttribute('data-claim-id');
    var state = App.state;
    var schedules = state.schedules || [];

    // 1단계: 금액 입력값 반영
    var amountInputs = form.querySelectorAll('input[data-schedule-id]');
    for (var i = 0; i < amountInputs.length; i++) {
      var input = amountInputs[i];
      var sid = input.getAttribute('data-schedule-id');
      var val = input.value != null ? String(input.value).trim() : '';
      var num = val === '' ? 0 : Number(val);
      if (!isFinite(num) || num < 0) num = 0;

      for (var j = 0; j < schedules.length; j++) {
        if (schedules[j].id === sid) {
          schedules[j].amount = num;
          break;
        }
      }
    }

    // 2단계: 상태(select)를 기준으로 PLANNED / PAID / OVERDUE 만 처리
    var selects = form.querySelectorAll('select[data-schedule-id]');
    for (var k = 0; k < selects.length; k++) {
      var sel = selects[k];
      var sid2 = sel.getAttribute('data-schedule-id');
      var rawStatus = sel.value || 'PLANNED';
      var status = String(rawStatus).toUpperCase();

      for (var m = 0; m < schedules.length; m++) {
        if (schedules[m].id === sid2) {
          var sc = schedules[m];
          var amount2 = Number(sc.amount) || 0;

          if (status === 'PAID') {
            sc.status = 'PAID';
            sc.paidAmount = amount2;
            sc.partialPaidAmount = 0;
          } else if (status === 'OVERDUE') {
            sc.status = 'OVERDUE';
            sc.paidAmount = 0;
            sc.partialPaidAmount = 0;
          } else {
            // PARTIAL 등 그 외 값은 모두 PLANNED 로 정규화
            sc.status = 'PLANNED';
            sc.paidAmount = 0;
            sc.partialPaidAmount = 0;
          }

          break;
        }
      }
    }

    if (App.modalManager && typeof App.modalManager.close === 'function') {
      App.modalManager.close();
    }
    if (api && typeof api.render === 'function') {
      api.render();
    }
    if (api && typeof api.refreshOtherViews === 'function') {
      api.refreshOtherViews();
    }
    if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function') {
      var claim2 = findClaim(claimId);
      if (claim2) {
        App.debtorDetail.render(String(claim2.debtorId));
      }
    }
  }
function handleLoanInputs(el, form) {
      var name = el.name;
      var principalInput = form.querySelector('[name="loan-principal"]');
      var rateInput = form.querySelector('[name="loan-rate"]');
      var totalInput = form.querySelector('[name="loan-total"]');
      if (!principalInput || !rateInput || !totalInput) return;
  
      var principal = Number(principalInput.value || 0);
      var rate = Number(rateInput.value || 0);
      var total = Number(totalInput.value || 0);
  
      var last = form.getAttribute('data-last-edited') || '';
  
      if (name === 'loan-rate') {
        form.setAttribute('data-last-edited', 'rate');
        if (principal) {
          var ratio = 1 + rate / 100;
          var t = principal * ratio;
          if (isFinite(t)) {
            totalInput.value = Math.round(t);
          }
        }
      } else if (name === 'loan-total') {
        form.setAttribute('data-last-edited', 'total');
        if (principal) {
          var ratio2 = total / principal;
          var r = (ratio2 - 1) * 100;
          if (isFinite(r)) {
            rateInput.value = Math.round(r * 10) / 10;
          }
        }
      } else if (name === 'loan-principal') {
        form.setAttribute('data-last-edited', 'principal');
        if (rate && !total) {
          var t2 = principal * (1 + rate / 100);
          if (isFinite(t2)) {
            totalInput.value = Math.round(t2);
          }
        } else if (last === 'total' && principal && total) {
          var ratio3 = total / principal;
          var r2 = (ratio3 - 1) * 100;
          if (isFinite(r2)) {
            rateInput.value = Math.round(r2 * 10) / 10;
          }
        }
      }
    }

  function updateLoanCycleVisibility(form) {
      var type = form.querySelector('[name="loan-cycle-type"]').value || 'day';
      var dayGroup = form.querySelector('[data-role="loan-day-group"]');
      var weekGroup = form.querySelector('[data-role="loan-week-group"]');
  
      if (dayGroup) dayGroup.style.display = (type === 'day') ? 'flex' : 'none';
      if (weekGroup) weekGroup.style.display = (type === 'week') ? 'flex' : 'none';
    }

  function updateClaimCycleVisibility(form) {
      var type = form.querySelector('[name="claim-cycle-type"]').value || 'day';
      var dayGroup = form.querySelector('[data-role="claim-day-group"]');
      var weekGroup = form.querySelector('[data-role="claim-week-group"]');
  
      if (dayGroup) dayGroup.style.display = (type === 'day') ? 'flex' : 'none';
      if (weekGroup) weekGroup.style.display = (type === 'week') ? 'flex' : 'none';
    }

  App.features.debtorsHandlers = {
    handleDebtorCreate: handleDebtorCreate,
    handleDebtorEdit: handleDebtorEdit,
    handleDebtorDelete: handleDebtorDelete,
    handleLoanCreate: handleLoanCreate,
    handleLoanEdit: handleLoanEdit,
    handleLoanDelete: handleLoanDelete,
    handleClaimCreate: handleClaimCreate,
    handleClaimEdit: handleClaimEdit,
    handleClaimDelete: handleClaimDelete,
    handleLoanScheduleSave: handleLoanScheduleSave,
    handleClaimScheduleSave: handleClaimScheduleSave,
    handleLoanInputs: handleLoanInputs,
    updateLoanCycleVisibility: updateLoanCycleVisibility,
    updateClaimCycleVisibility: updateClaimCycleVisibility
  };

})(window, document);