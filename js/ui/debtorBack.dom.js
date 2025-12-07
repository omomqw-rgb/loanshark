document.addEventListener("click", function(e){
  // v205: debtor-back-to-list + v126 debtor-list-mode 둘 다 지원
  var b = e.target.closest("[data-action='debtor-back-to-list'], [data-action='debtor-list-mode']");
  if(!b) return;

  if (window.App && App.state && App.state.ui && App.state.ui.debtorPanel) {
    App.state.ui.debtorPanel.mode = 'list';
    App.state.ui.debtorPanel.selectedDebtorId = null;
  }

  if(App.debtorPanel && typeof App.debtorPanel.showList === 'function') {
    App.debtorPanel.showList();
  }

  // DOM 기반 채무자리스트가 활성화된 경우 리스트를 다시 그려준다
  if (App.debtors && typeof App.debtors.updateFilteredList === 'function' && typeof App.debtors.renderList === 'function') {
    App.debtors.updateFilteredList();
    App.debtors.renderList();
  } else if (App.features && App.features.debtors && typeof App.features.debtors.render === 'function') {
    // 레거시 리스트 대비
    App.features.debtors.render();
  }
});