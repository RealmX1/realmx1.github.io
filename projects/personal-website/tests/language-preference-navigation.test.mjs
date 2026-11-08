import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const languageNavigationScript = readFileSync(
  new URL('../public/assets/language-preference-navigation.js', import.meta.url), 'utf8',
);
const languagePreferenceStorageKey = 'bomin-zhang-personal-website-language-preference';

function visitPersonalWebsite({
  entryPage = true, browserLanguages = ['en-US'], storedPreference,
  storageUnavailable = false, pageLanguage = 'en', suffix = '',
} = {}) {
  const redirectDestinations = [];
  const storedLanguagePreferences = new Map();
  const currentLocation = new URL(`https://realmx1.github.io/${suffix}`);
  currentLocation.replace = destination => redirectDestinations.push(destination);
  const browserWindow = { location: currentLocation };
  Object.defineProperty(browserWindow, 'localStorage', {
    get() {
      if (storageUnavailable) throw new Error('浏览器禁用了存储');
      return {
        getItem: () => storedPreference,
        setItem: (key, value) => storedLanguagePreferences.set(key, value),
      };
    },
  });

  runInNewContext(languageNavigationScript, {
    window: browserWindow,
    document: {
      baseURI: currentLocation.href,
      documentElement: {
        lang: pageLanguage,
        hasAttribute: name => name === 'data-language-redirect-entry' && entryPage,
      },
    },
    navigator: { languages: browserLanguages, language: browserLanguages[0] },
    URL,
  });
  return { redirectDestinations, storedLanguagePreferences };
}

test('中文浏览器进入中文版，其他语言默认进入英文版', () => {
  for (const browserLanguage of ['zh-CN', 'zh-TW', 'zh-HK', 'zh']) {
    assert.deepEqual(visitPersonalWebsite({ browserLanguages: [browserLanguage] }).redirectDestinations,
      ['https://realmx1.github.io/zh/']);
  }
  for (const browserLanguages of [['en-US', 'zh-CN'], ['fr-FR'], []]) {
    assert.deepEqual(visitPersonalWebsite({ browserLanguages }).redirectDestinations,
      ['https://realmx1.github.io/en/']);
  }
});

test('用户已选语言优先于浏览器语言', () => {
  assert.deepEqual(visitPersonalWebsite({ browserLanguages: ['zh-CN'], storedPreference: 'en' })
    .redirectDestinations, ['https://realmx1.github.io/en/']);
  assert.deepEqual(visitPersonalWebsite({ storedPreference: 'zh' }).redirectDestinations,
    ['https://realmx1.github.io/zh/']);
});

test('无效的存储值不会成为跳转路径', () => {
  for (const storedPreference of ['../elsewhere', 'https://example.com', 'unknown']) {
    assert.deepEqual(visitPersonalWebsite({ storedPreference }).redirectDestinations,
      ['https://realmx1.github.io/en/']);
  }
});

test('禁用存储时仍按浏览器语言进入站点', () => {
  assert.deepEqual(visitPersonalWebsite({ storageUnavailable: true, browserLanguages: ['zh-CN'] })
    .redirectDestinations, ['https://realmx1.github.io/zh/']);
});

test('入口跳转保留查询参数和章节锚点', () => {
  assert.deepEqual(visitPersonalWebsite({ suffix: '?from=calling-card#selected-work' })
    .redirectDestinations, ['https://realmx1.github.io/en/?from=calling-card#selected-work']);
});

test('直接访问双语页面会记住语言且不会再次跳转', () => {
  for (const [pageLanguage, preference] of [['en', 'en'], ['zh-CN', 'zh']]) {
    const result = visitPersonalWebsite({ entryPage: false, pageLanguage });
    assert.deepEqual(result.redirectDestinations, []);
    assert.equal(result.storedLanguagePreferences.get(languagePreferenceStorageKey), preference);
  }
});

test('存储不可用时双语正文页面仍可加载', () => {
  assert.doesNotThrow(() => visitPersonalWebsite({ entryPage: false, storageUnavailable: true }));
});
