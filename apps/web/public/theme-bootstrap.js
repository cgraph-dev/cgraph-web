(function bootstrapTheme() {
  var root = document.documentElement;
  var body = document.body;
  var loader = document.getElementById('initial-loader');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var storageKey = 'cgraph-theme-preferences';
  var defaultThemeId = 'aurora';
  var themes = {
    aurora: {
      category: 'dark',
      variantClass: 'theme-aurora',
      colorScheme: 'dark',
      bodyBackground: '#0d0f1c',
      bodyColor: '#ffffff',
      loaderBackground: 'linear-gradient(135deg, #080b14 0%, #11162a 52%, #0d0f1c 100%)',
      themeColor: '#0d0f1c',
    },
    dark: {
      category: 'dark',
      variantClass: 'theme-dark',
      colorScheme: 'dark',
      bodyBackground: '#111215',
      bodyColor: '#ffffff',
      loaderBackground: 'linear-gradient(135deg, #0c0c0f 0%, #17191d 50%, #111215 100%)',
      themeColor: '#111215',
    },
    light: {
      category: 'light',
      variantClass: 'theme-light',
      colorScheme: 'light',
      bodyBackground: '#f4f7fb',
      bodyColor: '#0f172a',
      loaderBackground: 'linear-gradient(180deg, #f8fbff 0%, #f4f7fb 46%, #eef3f9 100%)',
      themeColor: '#f4f7fb',
    },
    bubble: {
      category: 'dark',
      variantClass: 'theme-bubble',
      colorScheme: 'dark',
      bodyBackground: '#111827',
      bodyColor: '#ffffff',
      loaderBackground: 'linear-gradient(135deg, #0c1222 0%, #111827 50%, #0c1222 100%)',
      themeColor: '#111827',
    },
  };

  function resolveThemeId() {
    try {
      var storedPreferences = localStorage.getItem(storageKey);
      if (storedPreferences) {
        var parsed = JSON.parse(storedPreferences);
        var storedThemeId = parsed && parsed.activeThemeId;
        var settings = parsed && parsed.settings;
        if (
          settings &&
          settings.respectSystemPreference &&
          typeof window.matchMedia === 'function'
        ) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'aurora' : 'light';
        }
        if (storedThemeId && themes[storedThemeId]) {
          return storedThemeId;
        }
      }
    } catch (_error) {
      return defaultThemeId;
    }

    return defaultThemeId;
  }

  var themeId = resolveThemeId();
  var config = themes[themeId] || themes[defaultThemeId];

  root.classList.remove(
    'light',
    'dark',
    'theme-aurora',
    'theme-dark',
    'theme-light',
    'theme-bubble'
  );
  root.classList.add(config.category, config.variantClass);
  root.style.colorScheme = config.colorScheme;

  if (body) {
    body.classList.add('antialiased');
    body.style.backgroundColor = config.bodyBackground;
    body.style.color = config.bodyColor;
  }

  if (loader) {
    loader.style.background = config.loaderBackground;
  }

  if (themeMeta) {
    themeMeta.setAttribute('content', config.themeColor);
  }
})();
