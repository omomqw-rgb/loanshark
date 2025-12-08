(function (window) {
  'use strict';
  var App = window.App || (window.App = {});
  var util = App.util;

  function toISODate(date) {
    if (!(date instanceof Date)) date = new Date(date);
    if (isNaN(date.getTime())) return '';
    var y = date.getFullYear();
    var m = util.pad2(date.getMonth() + 1);
    var d = util.pad2(date.getDate());
    return y + '-' + m + '-' + d;
  }

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function nextMonthEnd(currentEnd) {
    return new Date(currentEnd.getFullYear(), currentEnd.getMonth() + 2, 0);
  }

  /* ===== Loan schedule ===== */

  function buildLoanSchedule(loan) {
    var schedules = [];
    var total = Number(loan.totalRepayAmount) || 0;
    var count = Number(loan.installmentCount) || 1;
    if (count < 1) count = 1;

    var base = count > 0 ? Math.floor(total / count) : total;
    var remainder = total - base * count;

    var start = new Date(loan.startDate || new Date());
    var cursor = new Date(start.getTime());

    var cycleType = loan.cycleType || 'day'; // 'day' | 'week' | 'monthEnd'
    var dayInterval = Number(loan.dayInterval) || 7;
    var weekDay = (loan.weekDay === 0 || loan.weekDay) ? Number(loan.weekDay) : null;

    for (var i = 1; i <= count; i++) {
      if (i === 1) {
        if (cycleType === 'monthEnd') {
          cursor = endOfMonth(start);
        } else if (cycleType === 'week' && weekDay !== null) {
          cursor = new Date(start.getTime());
          for (var k = 0; k < 14; k++) {
            if (cursor.getDay() === weekDay) break;
            cursor.setDate(cursor.getDate() + 1);
          }
        } else {
          cursor = new Date(start.getTime());
        }
      } else {
        if (cycleType === 'day') {
          cursor = addDays(cursor, dayInterval);
        } else if (cycleType === 'week') {
          cursor = addDays(cursor, 7);
        } else {
          cursor = nextMonthEnd(cursor);
        }
      }

      var dueISO = toISODate(cursor);
      var amt = base;
      if (remainder > 0) {
        amt += 1;
        remainder -= 1;
      }

      schedules.push({
        id: String(loan.id) + '-I' + i,
        kind: 'loan',
        debtorId: (loan.debtorId != null ? String(loan.debtorId) : null),
        loanId: (loan.id != null ? String(loan.id) : null),
        claimId: null,
        installmentNo: i,
        dueDate: dueISO,
        amount: amt,
        status: 'PLANNED',
        partialPaidAmount: 0
      });
    }

    return schedules;
  }

  /* ===== Claim schedule ===== */

  function buildClaimSchedule(claim) {
    var schedules = [];
    var count = Number(claim.installmentCount) || 1;
    if (count < 1) count = 1;

    var start = new Date(claim.startDate || new Date());
    var cursor = new Date(start.getTime());

    var cycleType = claim.cycleType || 'day';
    var dayInterval = Number(claim.dayInterval) || 7;
    var weekDay = (claim.weekDay === 0 || claim.weekDay) ? Number(claim.weekDay) : null;

    for (var i = 1; i <= count; i++) {
      if (i === 1) {
        if (cycleType === 'monthEnd') {
          cursor = endOfMonth(start);
        } else if (cycleType === 'week' && weekDay !== null) {
          cursor = new Date(start.getTime());
          for (var k = 0; k < 14; k++) {
            if (cursor.getDay() === weekDay) break;
            cursor.setDate(cursor.getDate() + 1);
          }
        } else {
          cursor = new Date(start.getTime());
        }
      } else {
        if (cycleType === 'day') {
          cursor = addDays(cursor, dayInterval);
        } else if (cycleType === 'week') {
          cursor = addDays(cursor, 7);
        } else {
          cursor = nextMonthEnd(cursor);
        }
      }

      var dueISO = toISODate(cursor);

      schedules.push({
        id: String(claim.id) + '-I' + i,
        kind: 'claim',
        debtorId: (claim.debtorId != null ? String(claim.debtorId) : null),
        loanId: null,
        claimId: (claim.id != null ? String(claim.id) : null),
        installmentNo: i,
        dueDate: dueISO,
        amount: 0,
        status: 'PLANNED'
      });
    }

    return schedules;
  }

  function deriveLoanFields(loan, loanSchedules) {
    var total = Number(loan.totalRepayAmount) || 0;
    var paid = 0;
    var todayISO = new Date().toISOString().slice(0, 10);
    var nextDue = null;
    var hasOverdue = false;

    var sorted = (loanSchedules || []).slice().sort(function (a, b) {
      var av = a.dueDate || '';
      var bv = b.dueDate || '';
      if (av === bv) return 0;
      return av < bv ? -1 : 1;
    });

    for (var i = 0; i < sorted.length; i++) {
      var s = sorted[i];
      var amount = Number(s.amount) || 0;
      var partial = Number(s.partialPaidAmount || 0);

      if (s.status === 'PAID') {
        paid += amount;
      } else if (s.status === 'PARTIAL') {
        paid += partial;
      }

      if (s.status !== 'PAID') {
        if (!nextDue || (s.dueDate || '') < nextDue) {
          nextDue = s.dueDate;
        }
        if ((s.dueDate || '') < todayISO) {
          var outstanding = amount;
          if (s.status === 'PARTIAL') {
            outstanding = Math.max(0, amount - partial);
          }
          if (outstanding > 0) {
            hasOverdue = true;
          }
        }
      }
    }

    loan.paidAmount = paid;
    var remaining = total - paid;
    if (!isFinite(remaining)) remaining = 0;
    if (remaining < 0) remaining = 0;
    loan.remainingAmount = remaining;

    if (remaining <= 0) {
      loan.status = '완납';
    } else if (hasOverdue) {
      loan.status = '연체';
    } else {
      loan.status = '진행';
    }
    loan.nextDueDate = nextDue;
  }

  function cloneSchedule(src) {
    if (!src || typeof src !== 'object') return src;
    var copy = {};
    for (var key in src) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
      copy[key] = src[key];
    }
    return copy;
  }

  function rebuildSchedulesForLoan(loanId) {
    var state = App.state || (App.state = {});
    var data = App.data || (App.data = {});

    var normalizedLoanId = (loanId != null) ? String(loanId) : loanId;

    // 1) loan 찾기 (state 우선, data fallback)
    var loan = null;
    var stateLoans = state.loans || [];
    for (var i = 0; i < stateLoans.length; i++) {
      var candidate = stateLoans[i];
      if (!candidate) continue;
      if (String(candidate.id) === String(normalizedLoanId)) {
        loan = candidate;
        break;
      }
    }

    if (!loan) {
      var dataLoans = data.loans || [];
      for (var j = 0; j < dataLoans.length; j++) {
        var candidate2 = dataLoans[j];
        if (!candidate2) continue;
        if (String(candidate2.id) === String(normalizedLoanId)) {
          loan = candidate2;
          break;
        }
      }
    }

    if (!loan) return;

    // 2) 기존 해당 Loan 스케줄 삭제 (state/data 둘 다)
    var filterFn = function (s) {
      if (!s) return true;
      if (s.kind !== 'loan') return true;
      return String(s.loanId) !== String(normalizedLoanId);
    };

    state.schedules = (state.schedules || []).filter(filterFn);
    data.schedules = (data.schedules || []).filter(filterFn);

    // 3) 새 스케줄 생성
    var newSchedules = buildLoanSchedule(loan) || [];

    if (!state.schedules) state.schedules = [];
    if (!data.schedules) data.schedules = [];

    // 4) state + data 동시에 push (ID string 정규화)
    for (var k = 0; k < newSchedules.length; k++) {
      var s = newSchedules[k];
      if (!s) continue;

      if (s.id != null) s.id = String(s.id);
      if (s.loanId != null) s.loanId = String(s.loanId);
      if (s.debtorId != null) s.debtorId = String(s.debtorId);
      if (s.claimId != null) s.claimId = String(s.claimId);

      state.schedules.push(s);
      data.schedules.push(cloneSchedule(s));
    }

    // 5) ID 타입 통일 (특히 loanId)
    var allStateSchedules = state.schedules || [];
    for (var p = 0; p < allStateSchedules.length; p++) {
      var sc = allStateSchedules[p];
      if (!sc || sc.loanId == null) continue;
      sc.loanId = String(sc.loanId);
    }

    var allDataSchedules = data.schedules || [];
    for (var q = 0; q < allDataSchedules.length; q++) {
      var sc2 = allDataSchedules[q];
      if (!sc2 || sc2.loanId == null) continue;
      sc2.loanId = String(sc2.loanId);
    }

    // 6) Loan 파생 필드 재계산
    deriveLoanFields(loan, newSchedules);
  }

  function rebuildSchedulesForClaim(claimId) {
    var state = App.state || (App.state = {});
    var data = App.data || (App.data = {});

    var normalizedClaimId = (claimId != null) ? String(claimId) : claimId;

    // 1) claim 찾기 (state 우선, data fallback)
    var claim = null;
    var stateClaims = state.claims || [];
    for (var i = 0; i < stateClaims.length; i++) {
      var candidate = stateClaims[i];
      if (!candidate) continue;
      if (String(candidate.id) === String(normalizedClaimId)) {
        claim = candidate;
        break;
      }
    }

    if (!claim) {
      var dataClaims = data.claims || [];
      for (var j = 0; j < dataClaims.length; j++) {
        var candidate2 = dataClaims[j];
        if (!candidate2) continue;
        if (String(candidate2.id) === String(normalizedClaimId)) {
          claim = candidate2;
          break;
        }
      }
    }

    if (!claim) return;

    // 2) 기존 해당 Claim 스케줄 삭제 (state/data 둘 다)
    var filterFn = function (s) {
      if (!s) return true;
      if (s.kind !== 'claim') return true;
      return String(s.claimId) !== String(normalizedClaimId);
    };

    state.schedules = (state.schedules || []).filter(filterFn);
    data.schedules = (data.schedules || []).filter(filterFn);

    // 3) 새 스케줄 생성
    var newSchedules = buildClaimSchedule(claim) || [];

    if (!state.schedules) state.schedules = [];
    if (!data.schedules) data.schedules = [];

    // 4) state + data 동시에 push (ID string 정규화)
    for (var k = 0; k < newSchedules.length; k++) {
      var s = newSchedules[k];
      if (!s) continue;

      if (s.id != null) s.id = String(s.id);
      if (s.claimId != null) s.claimId = String(s.claimId);
      if (s.debtorId != null) s.debtorId = String(s.debtorId);
      if (s.loanId != null) s.loanId = String(s.loanId);

      state.schedules.push(s);
      data.schedules.push(cloneSchedule(s));
    }

    // 5) ID 타입 통일 (특히 claimId)
    var allStateSchedules = state.schedules || [];
    for (var p = 0; p < allStateSchedules.length; p++) {
      var sc = allStateSchedules[p];
      if (!sc || sc.claimId == null) continue;
      sc.claimId = String(sc.claimId);
    }

    var allDataSchedules = data.schedules || [];
    for (var q = 0; q < allDataSchedules.length; q++) {
      var sc2 = allDataSchedules[q];
      if (!sc2 || sc2.claimId == null) continue;
      sc2.claimId = String(sc2.claimId);
    }
  }

  function seedDummyData() {
    var state = App.state;

    var debtors = [
      { id: 'D001', name: '홍길동', phone: '010-1111-2222', createdAt: '2025-01-03', status: '진행', note: '' },
      { id: 'D002', name: '김영희', phone: '010-3333-4444', createdAt: '2025-01-10', status: '진행', note: '' }
    ];

    var loans = [
      {
        id: 'L001',
        debtorId: 'D001',
        principal: 5000000,
        interestRate: 20,
        totalRepayAmount: Math.round(5000000 * 1.2),
        installmentCount: 10,
        startDate: '2025-02-01',
        cycleType: 'day',
        dayInterval: 7,
        weekDay: null,
        createdAt: '2025-02-01',
        paidAmount: 0,
        remainingAmount: 0,
        status: '진행',
        nextDueDate: null
        ,
        // 카드 상태: 진행, 완료, 꺾기. 기본값은 진행.
        cardStatus: '진행'
      },
      {
        id: 'L002',
        debtorId: 'D001',
        principal: 1200000,
        interestRate: 18,
        totalRepayAmount: Math.round(1200000 * 1.18),
        installmentCount: 6,
        startDate: '2025-03-10',
        cycleType: 'monthEnd',
        dayInterval: 7,
        weekDay: null,
        createdAt: '2025-03-10',
        paidAmount: 0,
        remainingAmount: 0,
        status: '진행',
        nextDueDate: null
        ,
        cardStatus: '진행'
      }
    ];

    var claims = [
      {
        id: 'C001',
        debtorId: 'D001',
        amount: 600000,
        installmentCount: 6,
        startDate: '2025-03-01',
        cycleType: 'week',
        dayInterval: 7,
        weekDay: 1,
        createdAt: '2025-03-01',
        memo: ''
        ,
        // 카드 상태 기본값
        cardStatus: '진행'
      },
      {
        id: 'C002',
        debtorId: 'D002',
        amount: 300000,
        installmentCount: 3,
        startDate: '2025-03-20',
        cycleType: 'monthEnd',
        dayInterval: 7,
        weekDay: null,
        createdAt: '2025-03-20',
        memo: ''
        ,
        cardStatus: '진행'
      }
    ];

    state.debtors = debtors;
    state.loans = loans;
    state.claims = claims;
    state.schedules = [];

    for (var i = 0; i < loans.length; i++) {
      rebuildSchedulesForLoan(loans[i].id);
    }
    for (var j = 0; j < claims.length; j++) {
      rebuildSchedulesForClaim(claims[j].id);
    }
  }

  App.db = {
    rebuildSchedulesForLoan: rebuildSchedulesForLoan,
    rebuildSchedulesForClaim: rebuildSchedulesForClaim,
    buildLoanSchedule: buildLoanSchedule,
    buildClaimSchedule: buildClaimSchedule,
    deriveLoanFields: deriveLoanFields
  };
})(window);
