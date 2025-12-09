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

      state.debtors = state.debtors.filter(function (d) {
        return d.id !== id;
      });

      state.loans = state.loans.filter(function (loan) {
        return loan.debtorId !== id;
      });

      state.claims = state.claims.filter(function (claim) {
        return claim.debtorId !== id;
      });

      if (App.schedulesEngine && typeof App.schedulesEngine.removeByDebtorId === 'function') {
        App.schedulesEngine.removeByDebtorId(id);
      }

      App.state.ui.debtorPanel.mode = 'list';
      App.state.ui.debtorPanel.selectedDebtorId = null;

      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }

      if (App.data && App.data.debtors && App.data.debtorsDetailed) {
        App.data.debtors = App.data.debtors.filter(function (d) {
          return d.id !== id;
        });
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

      var state = App.state || (App.state = {});
      var data = App.data || (App.data = {});

      var loans = state.loans || (state.loans = []);
      if (!data.loans) data.loans = loans;
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

      if (data.loans !== loans) {
        data.loans.push(loan);
      }

      if (App.db && typeof App.db.rebuildSchedulesForLoan === 'function') {
        App.db.rebuildSchedulesForLoan(newId);
      }

      // 스케줄 재생성 후 Debtor 브리지 재빌드 (App.data 기준)
      if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
        var bridge = App.data.buildDebtorsDetailed(
          data.debtors || [],
          data.loans || [],
          data.claims || [],
          data.schedules || []
        );
        if (bridge) {
          data.debtors = bridge.list || data.debtors || [];
          data.debtorsDetailed = bridge.byId || data.debtorsDetailed || {};
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

        // 스케줄 재생성 후 Debtor 브리지 재빌드 (App.data 기준)
        if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
          var bridge = App.data.buildDebtorsDetailed(
            App.data.debtors || [],
            App.data.loans || [],
            App.data.claims || [],
            App.data.schedules || []
          );
          if (bridge) {
            App.data.debtors = bridge.list || App.data.debtors || [];
            App.data.debtorsDetailed = bridge.byId || App.data.debtorsDetailed || {};
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
        App.debtorDetail.render(String(loan.debtorId));
      }
    }

  
  function handleLoanDelete(loanId) {
      var api = App.features && App.features.debtors;
      var state = App.state || (App.state = {});
      var data = App.data || (App.data = {});

      // 1) loan 찾기 (state 우선, 그다음 data)
      var loan = findLoan(loanId);
      if (!loan) {
        var dataLoansSearch = data.loans || [];
        for (var i = 0; i < dataLoansSearch.length; i++) {
          var candidate = dataLoansSearch[i];
          if (candidate && String(candidate.id) === String(loanId)) {
            loan = candidate;
            break;
          }
        }
      }
      if (!loan) return;

      var debtorId = loan.debtorId;
      if (!window.confirm('대출 카드를 삭제할까요?')) return;

      // 2) App.state.* 에서 삭제
      var stateLoans = state.loans || [];
      state.loans = stateLoans.filter(function (l) {
        return !l || String(l.id) !== String(loanId);
      });

      if (App.schedulesEngine && typeof App.schedulesEngine.removeByLoanId === 'function') {
        App.schedulesEngine.removeByLoanId(loanId);
      }

      // 3) App.data.* 에서 삭제
      if (data && data.loans) {
        data.loans = data.loans.filter(function (l) {
          return !l || String(l.id) !== String(loanId);
        });
      }
      if (data && data.schedules) {
        // schedulesEngine 이 state/data.schedules 를 alias 로 유지하므로
        // 별도 data.schedules 필터는 수행하지 않는다 (Stage1).
      }

      // 4) Debtor bridge 재생성 (App.data.* 기준)
      if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
        var bridge = App.data.buildDebtorsDetailed(
          data.debtors || [],
          data.loans || [],
          data.claims || [],
          data.schedules || []
        );
        if (bridge) {
          data.debtors = bridge.list || data.debtors || [];
          data.debtorsDetailed = bridge.byId || data.debtorsDetailed || {};
        }
      }

      // 5) UI 갱신
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function' && debtorId != null) {
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
      var memoInput = form.querySelector('[name="claim-memo"]');
      var memo = memoInput ? memoInput.value : '';

      if (!amount) {
        alert('채권금을 입력하세요.');
        return;
      }
      if (!count || count < 1) {
        alert('회차 수를 1 이상으로 입력하세요.');
        return;
      }

      var state = App.state || (App.state = {});
      var data = App.data || (App.data = {});

      var claims = state.claims || (state.claims = []);
      if (!data.claims) data.claims = claims;
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
        memo: memo,
        cardStatus: '진행'
      };

      claims.push(claim);

      if (data.claims !== claims) {
        data.claims.push(claim);
      }

      // DebtorDetail용 브리지에 채권 카드 추가 (간단 반영)
      if (App.data && App.data.debtorsDetailed) {
        var dd = App.data.debtorsDetailed;
        var key = String(debtorId);
        var ddItem = dd[key];
        if (ddItem) {
          if (!ddItem.claims) ddItem.claims = [];
          ddItem.claims.push({
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

      if (App.db && typeof App.db.rebuildSchedulesForClaim === 'function') {
        App.db.rebuildSchedulesForClaim(newId);
      }

      // 스케줄 재생성 후 Debtor 브리지 재빌드 (App.data 기준)
      if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
        var bridge = App.data.buildDebtorsDetailed(
          App.data.debtors || [],
          App.data.loans || [],
          App.data.claims || [],
          App.data.schedules || []
        );
        if (bridge) {
          App.data.debtors = bridge.list || App.data.debtors || [];
          App.data.debtorsDetailed = bridge.byId || App.data.debtorsDetailed || {};
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

        // 스케줄 재생성 후 Debtor 브리지 재빌드 (App.data 기준)
        if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
          var bridge = App.data.buildDebtorsDetailed(
            App.data.debtors || [],
            App.data.loans || [],
            App.data.claims || [],
            App.data.schedules || []
          );
          if (bridge) {
            App.data.debtors = bridge.list || App.data.debtors || [];
            App.data.debtorsDetailed = bridge.byId || App.data.debtorsDetailed || {};
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
        App.debtorDetail.render(String(debtorId));
      }
    }

  
  function handleClaimDelete(claimId) {
      var api = App.features && App.features.debtors;
      var state = App.state || (App.state = {});
      var data = App.data || (App.data = {});

      // 1) claim 찾기 (state 우선, 그다음 data)
      var claim = findClaim(claimId);
      if (!claim) {
        var dataClaimsSearch = data.claims || [];
        for (var i = 0; i < dataClaimsSearch.length; i++) {
          var candidate = dataClaimsSearch[i];
          if (candidate && String(candidate.id) === String(claimId)) {
            claim = candidate;
            break;
          }
        }
      }
      if (!claim) return;

      var debtorId = claim.debtorId;
      if (!window.confirm('채권 카드를 삭제할까요?')) return;

      // 2) App.state.* 에서 삭제
      var stateClaims = state.claims || [];
      state.claims = stateClaims.filter(function (c) {
        return !c || String(c.id) !== String(claimId);
      });

      if (App.schedulesEngine && typeof App.schedulesEngine.removeByClaimId === 'function') {
        App.schedulesEngine.removeByClaimId(claimId);
      }

      // 3) App.data.* 에서 삭제
      if (data && data.claims) {
        data.claims = data.claims.filter(function (c) {
          return !c || String(c.id) !== String(claimId);
        });
      }
      if (data && data.schedules) {
        // schedulesEngine 이 state/data.schedules 를 alias 로 유지하므로
        // 별도 data.schedules 필터는 수행하지 않는다 (Stage1).
      }

      // 4) Debtor bridge 재생성 (App.data.* 기준)
      if (App.data && typeof App.data.buildDebtorsDetailed === 'function') {
        var bridge = App.data.buildDebtorsDetailed(
          data.debtors || [],
          data.loans || [],
          data.claims || [],
          data.schedules || []
        );
        if (bridge) {
          data.debtors = bridge.list || data.debtors || [];
          data.debtorsDetailed = bridge.byId || data.debtorsDetailed || {};
        }
      }

      // 5) UI 갱신
      if (api && typeof api.render === 'function') {
        api.render();
      }
      if (api && typeof api.refreshOtherViews === 'function') {
        api.refreshOtherViews();
      }
      if (window.App && App.debtorDetail && typeof App.debtorDetail.render === 'function' && debtorId != null) {
        App.debtorDetail.render(String(debtorId));
      }
    }



    function handleLoanScheduleSave(form) {
      if (App.schedulesEngine && typeof App.schedulesEngine.bulkUpdateFromLoanForm === 'function') {
        App.schedulesEngine.bulkUpdateFromLoanForm(form);
      }
    }



  function handleClaimScheduleSave(form) {
      if (App.schedulesEngine && typeof App.schedulesEngine.bulkUpdateFromClaimForm === 'function') {
        App.schedulesEngine.bulkUpdateFromClaimForm(form);
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