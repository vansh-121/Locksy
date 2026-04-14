// ============================================================================
// THEME MANAGER - Synced theme toggle across all extension pages
// Simple toggle: Light (day) / Dark (night)
// ============================================================================

(function () {
  'use strict';

  var STORAGE_KEY = 'locksyThemePreference';

  /**
   * Apply theme to the current page
   */
  function applyTheme(theme) {
    // Normalize: only 'light' or 'dark'
    if (theme !== 'dark') theme = 'light';

    document.documentElement.setAttribute('data-theme', theme);

    if (document.body) {
      if (theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    updateToggleIcon(theme);
  }

  /**
   * Update the visual state of the theme toggle button (if present)
   */
  function updateToggleIcon(theme) {
    var btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    var iconSpan = btn.querySelector('.theme-toggle-icon');
    var textSpan = btn.querySelector('.theme-toggle-text');
    if (!iconSpan) return;

    if (theme === 'dark') {
      // Currently Dark -> Show Light/Sun icon to switch
      iconSpan.textContent = '\u2600\uFE0F';
      btn.title = 'Switch to Light mode';
      if (textSpan) textSpan.textContent = 'Light Mode';
    } else {
      // Currently Light -> Show Dark/Moon icon to switch
      iconSpan.textContent = '\u{1F319}';
      btn.title = 'Switch to Dark mode';
      if (textSpan) textSpan.textContent = 'Dark Mode';
    }
  }

  /**
   * Bind click handler to the theme toggle button (if it exists)
   */
  function bindToggleButton() {
    var btn = document.getElementById('themeToggleBtn');
    if (btn && !btn.dataset.themeInit) {
      btn.dataset.themeInit = 'true';
      btn.addEventListener('click', function () {
        chrome.storage.local.get([STORAGE_KEY], function (d) {
          var current = d[STORAGE_KEY] || 'light';
          var next = current === 'dark' ? 'light' : 'dark';
          chrome.storage.local.set({ [STORAGE_KEY]: next }, function () {
            applyTheme(next);
          });
        });
      });
    }
    // Update icon to match current state
    chrome.storage.local.get([STORAGE_KEY], function (data) {
      if (chrome.runtime.lastError) return;
      var theme = data[STORAGE_KEY];
      // First time: detect from system preference
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        chrome.storage.local.set({ [STORAGE_KEY]: theme });
      }
      updateToggleIcon(theme);
    });
  }

  /**
   * Initialize theme immediately to prevent flash
   */
  function initThemeEarly() {
    try {
      chrome.storage.local.get([STORAGE_KEY], function (data) {
        if (chrome.runtime.lastError) return;
        var theme = data[STORAGE_KEY];
        if (!theme) {
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          chrome.storage.local.set({ [STORAGE_KEY]: theme });
        }
        applyTheme(theme);
      });
    } catch (e) {
      // Fallback
    }
  }

  /**
   * Full initialization after DOM is ready
   */
  function initThemeFull() {
    chrome.storage.local.get([STORAGE_KEY], function (data) {
      if (chrome.runtime.lastError) return;
      var theme = data[STORAGE_KEY];
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        chrome.storage.local.set({ [STORAGE_KEY]: theme });
      }
      applyTheme(theme);
      bindToggleButton();
    });

    // Listen for storage changes from other pages / popup
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area === 'local' && changes[STORAGE_KEY]) {
        var newTheme = changes[STORAGE_KEY].newValue || 'light';
        applyTheme(newTheme);
      }
    });
  }

  /**
   * Exposed globally so popup.js can re-bind after dynamic DOM recreation
   */
  window.reinitThemeToggle = function () {
    chrome.storage.local.get([STORAGE_KEY], function (data) {
      if (chrome.runtime.lastError) return;
      var theme = data[STORAGE_KEY];
      if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        chrome.storage.local.set({ [STORAGE_KEY]: theme });
      }
      applyTheme(theme);
      bindToggleButton();
    });
  };

  // --- Run ---
  initThemeEarly();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeFull);
  } else {
    initThemeFull();
  }
})();
