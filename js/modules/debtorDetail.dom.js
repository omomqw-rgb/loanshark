
// DebtorDetail DOM Wrapper (v133)
window.App = window.App || {};
App.debtorDetail = App.debtorDetail || {};


App.debtorDetail.render = function(id){
   var debtorId = id != null ? String(id) : null;
   if (!debtorId) return;

   // locate panel root
   var panelRoot = document.getElementById('debtor-panel-root');
   if (!panelRoot) return;

   // clear existing content
   while (panelRoot.firstChild) {
      panelRoot.removeChild(panelRoot.firstChild);
   }

   // create detail root for DebtorDetail engine
   var detailRoot = document.createElement('div');
   detailRoot.id = 'debtor-detail-root';
   panelRoot.appendChild(detailRoot);

   // call v126-style DebtorDetail engine
   if (App.modules && App.modules.DebtorDetail && typeof App.modules.DebtorDetail.render === 'function') {
      App.modules.DebtorDetail.render(debtorId);
   }

   // ensure side panel shows detail view
   if (App.debtorPanel && typeof App.debtorPanel.showDetail === 'function') {
      App.debtorPanel.showDetail();
   }

   // emit compatibility event
   if (typeof document !== 'undefined' && document.dispatchEvent) {
      document.dispatchEvent(new Event('detail-render-complete'));
   }
};

// wrap existing openDetail call if exists
App.debtors = App.debtors || {};
App.debtors.openDetail = App.debtors.openDetail || function(id){
    if(App.debtorDetail.render){
        App.debtorDetail.render(id);
    }
};

// NEW: ensure DOM visibility controlled by debtorPanel
App.debtorDetail.show = function(){
   if(App.debtorPanel && App.debtorPanel.showDetail){
      App.debtorPanel.showDetail();
   }
};

// NEW: simple binding to detect detail render completion
// (Assumes detail engine writes into #debtor-panel-root)
document.addEventListener("detail-render-complete", function(){
   App.debtorDetail.show();
});
