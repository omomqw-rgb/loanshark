(function (window) {
  'use strict';
  var App = window.App || (window.App = {});

  var SUPABASE_URL = "https://qiiprpuyrywtfvccbxcw.supabase.co";
  var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaXBycHV5cnl3dGZ2Y2NieGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMwMjMsImV4cCI6MjA3OTU2OTAyM30.-WGzDylLPEQunZgLyykSbq8vTYQg1CmjcPOQdrG8raE"; // anon or service role key

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    App.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('[Supabase] Global supabase client is not available.');
    App.supabase = null;
  }

  /**
   * Get initialized Supabase client safely.
   */
  function getClient() {
    if (!App.supabase) {
      console.warn('[Supabase] App.supabase is not initialized.');
      return null;
    }
    return App.supabase;
  }

  /**
   * Fetch latest app_states row for the current user (or given userId).
   * Always uses updated_at DESC, LIMIT 1 with no caching.
   *
   * @param {string|null} userId
   * @returns {Promise<{ data: any, error: any }>>}
   */
  async function getLatestAppState(userId) {
    var supa = getClient();
    if (!supa) {
      return { data: null, error: new Error('Supabase client is not initialized.') };
    }

    var uid = userId || (App.user && App.user.id) || null;

    var query = supa
      .from('app_states')
      .select('*');

    if (uid) {
      query = query.eq('user_id', uid);
    }

    var result = await query
      .order('updated_at', { ascending: false })
      .limit(1);

    return result;
  }

  App.supabaseHelpers = App.supabaseHelpers || {};
  App.supabaseHelpers.getClient = getClient;
  App.supabaseHelpers.getLatestAppState = getLatestAppState;
})(window);
