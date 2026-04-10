(function () {
  var html = document.documentElement;
  var btn = document.getElementById('themeBtn');

  // Returns the stored user preference: 'light' | 'dark' | 'system'
  // Migrates any legacy 'theme' key on first run.
  function getPref() {
    var pref = localStorage.getItem('themePref');
    if (pref === 'light' || pref === 'dark' || pref === 'system') return pref;
    // One-time migration from legacy key (stored resolved value, not pref)
    var legacy = localStorage.getItem('theme');
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem('themePref', legacy);
      localStorage.removeItem('theme');
      return legacy;
    }
    return 'system'; // Default: follow system on first visit
  }

  function setPref(pref) {
    localStorage.setItem('themePref', pref);
  }

  // Resolve a user preference to the actual applied theme value
  function resolveApplied(pref) {
    return pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
  }

  // Cycle order: light → dark → system → light
  function getNextPref(pref) {
    if (pref === 'light') return 'dark';
    if (pref === 'dark') return 'system';
    return 'light';
  }

  function updateButton(pref) {
    var next = getNextPref(pref);
    btn.setAttribute('data-mode', pref);
    btn.setAttribute('data-tooltip', next.charAt(0).toUpperCase() + next.slice(1));
  }

  function applyTheme(pref) {
    html.setAttribute('data-theme', resolveApplied(pref));
    updateButton(pref);
  }

  function showFeedback(pref) {
    var label = pref.charAt(0).toUpperCase() + pref.slice(1);
    var feedback = document.createElement('div');
    feedback.className = 'theme-feedback';
    feedback.textContent = 'Theme set to ' + label;
    document.body.appendChild(feedback);
    setTimeout(function () {
      feedback.classList.add('hide');
      setTimeout(function () { document.body.removeChild(feedback); }, 300);
    }, 2000);
  }

  // Initialize — apply current pref to DOM without writing to storage
  applyTheme(getPref());

  // Cycle on click: persist new pref, apply, show feedback
  btn.addEventListener('click', function () {
    var next = getNextPref(getPref());
    setPref(next);
    applyTheme(next);
    showFeedback(next);
    // Suppress hover icon swap briefly so sticky-hover on touch doesn't
    // show the wrong icon after the theme changes
    btn.classList.add('no-hover');
    setTimeout(function () { btn.classList.remove('no-hover'); }, 500);
  });

  // Re-apply when system theme changes, but only if user is on 'system' pref
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (getPref() === 'system') {
      html.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  });
})();

// Delegated navigation for [data-href] wrappers (post/featured items)
document.addEventListener('click', function (e) {
  var item = e.target.closest('[data-href]');
  if (!item) return;
  if (e.target.closest('a')) return;
  window.location.href = item.getAttribute('data-href');
});
