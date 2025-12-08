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
})(window);
