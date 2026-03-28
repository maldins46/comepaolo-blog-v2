(function () {
  var html = document.documentElement;
  var btn = document.getElementById('themeBtn');

  function getCurrentTheme() {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getNextTheme(current) {
    return current === 'light' ? 'dark' : 'light';
  }

  function updateButton() {
    var current = getCurrentTheme();
    var next = getNextTheme(current);
    btn.setAttribute('data-mode', current);
    btn.setAttribute('data-tooltip', next.charAt(0).toUpperCase() + next.slice(1));
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function showFeedback(theme) {
    var feedback = document.createElement('div');
    feedback.className = 'theme-feedback';
    feedback.textContent = 'Theme set to ' + (theme.charAt(0).toUpperCase() + theme.slice(1));
    document.body.appendChild(feedback);

    setTimeout(function () {
      feedback.classList.add('hide');
      setTimeout(function () {
        document.body.removeChild(feedback);
      }, 300);
    }, 2000);
  }

  // Initialize
  var initialTheme = getCurrentTheme();
  applyTheme(initialTheme);
  updateButton();

  // Toggle between light and dark
  btn.addEventListener('click', function () {
    var current = getCurrentTheme();
    var next = getNextTheme(current);
    applyTheme(next);
    updateButton();
    showFeedback(next);
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    var stored = localStorage.getItem('theme');
    if (!stored) {
      var theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      html.setAttribute('data-theme', theme);
      updateButton();
    }
  });
})();
