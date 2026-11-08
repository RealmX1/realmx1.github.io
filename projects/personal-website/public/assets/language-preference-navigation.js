(() => {
  const languagePreferenceStorageKey = 'bomin-zhang-personal-website-language-preference';

  if (document.documentElement.hasAttribute('data-language-redirect-entry')) {
    let savedLanguagePreference;
    try {
      savedLanguagePreference = window.localStorage.getItem(languagePreferenceStorageKey);
    } catch {
      // 禁用存储不应阻止访客进入网站。
    }
    const browserLanguage = navigator.languages?.[0] || navigator.language || 'en';
    const selectedLanguage = ['en', 'zh'].includes(savedLanguagePreference)
      ? savedLanguagePreference
      : /^zh(?:-|$)/i.test(browserLanguage) ? 'zh' : 'en';
    const destination = new URL(`${selectedLanguage}/`, document.baseURI);
    destination.search = window.location.search;
    destination.hash = window.location.hash;
    window.location.replace(destination.href);
    return;
  }

  try {
    window.localStorage.setItem(languagePreferenceStorageKey,
      document.documentElement.lang === 'zh-CN' ? 'zh' : 'en');
  } catch {
    // 页面与语言链接在浏览器无法记住偏好时仍然有效。
  }
})();
