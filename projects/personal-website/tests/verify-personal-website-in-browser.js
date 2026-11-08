async (page) => {
  const siteOrigin = await page.evaluate(() => window.location.origin);
  const browser = page.context().browser();
  const completedChecks = [];
  const browserFailures = [];
  const verify = (condition, message) => { if (!condition) throw new Error(message); };
  const monitorPage = (visitedPage) => {
    visitedPage.on('pageerror', error => browserFailures.push(error.message));
    visitedPage.on('console', message => {
      if (message.type() === 'error') browserFailures.push(message.text());
    });
    visitedPage.on('response', response => {
      if (response.url().startsWith(siteOrigin) && response.status() >= 400) {
        browserFailures.push(`${response.status()} ${response.url()}`);
      }
    });
  };

  for (const locale of ['en-US', 'zh-CN']) {
    const context = await browser.newContext({ locale, viewport: { width: 1280, height: 960 } });
    try {
      const visitorPage = await context.newPage();
      monitorPage(visitorPage);
      const languagePath = locale === 'zh-CN' ? '/zh/' : '/en/';
      await visitorPage.goto(`${siteOrigin}/`);
      await visitorPage.waitForURL(url => url.pathname === languagePath);
      verify(await visitorPage.locator('h1').textContent() === 'Bomin Zhang', '首页必须显示姓名');
      verify(await visitorPage.locator('.project-entry').count() === 5, '必须展示五项作品');
      verify(await visitorPage.locator('[data-education-entry]').count() === 4, '必须展示四段学历');
      verify(await visitorPage.locator('[data-undergraduate-degree]').count() === 1, '本科条目不得重复');
      verify(await visitorPage.locator('.ongoing-status').textContent() ===
        (locale === 'zh-CN' ? '在读' : 'In progress'), '博士阶段必须标明在读');

      for (const width of [320, 390, 768, 1280]) {
        await visitorPage.setViewportSize({ width, height: 960 });
        const fitsViewport = await visitorPage.evaluate(() =>
          document.documentElement.scrollWidth <= window.innerWidth);
        verify(fitsViewport, `${locale} 在 ${width}px 宽度不得横向溢出`);
      }
      completedChecks.push(`${locale}：入口、正文、学历与四种屏幕宽度通过`);

      const alternateLanguageLink = visitorPage.locator('.language-navigation a:not([aria-current])');
      await alternateLanguageLink.click();
      const alternatePath = locale === 'zh-CN' ? '/en/' : '/zh/';
      await visitorPage.waitForURL(url => url.pathname === alternatePath);
      await visitorPage.goto(`${siteOrigin}/`);
      await visitorPage.waitForURL(url => url.pathname === alternatePath);
      completedChecks.push(`${locale}：手动切换与语言偏好恢复通过`);
    } finally {
      await context.close();
    }
  }

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    const noScriptPage = await noScriptContext.newPage();
    monitorPage(noScriptPage);
    await noScriptPage.goto(`${siteOrigin}/`);
    verify(await noScriptPage.locator('.entry-language-options a').count() === 2,
      '无脚本时必须保留两个语言入口');
    await noScriptPage.getByRole('link', { name: '简体中文' }).click();
    verify(await noScriptPage.locator('.project-entry').count() === 5, '无脚本时中文正文仍完整');
    await noScriptPage.getByRole('link', { name: 'Switch to English' }).click();
    verify(await noScriptPage.locator('.project-entry').count() === 5, '无脚本时仍可切换到英文正文');
    completedChecks.push('禁用 JavaScript：入口、正文与语言切换通过');
  } finally {
    await noScriptContext.close();
  }

  const blockedStorageContext = await browser.newContext({ locale: 'zh-CN' });
  try {
    await blockedStorageContext.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('禁止存储'); } });
    });
    const blockedStoragePage = await blockedStorageContext.newPage();
    monitorPage(blockedStoragePage);
    await blockedStoragePage.goto(`${siteOrigin}/`);
    await blockedStoragePage.waitForURL(url => url.pathname === '/zh/');
    verify(await blockedStoragePage.locator('.project-entry').count() === 5, '禁用存储不能阻止正文加载');
    completedChecks.push('禁用存储：入口与正文通过');
  } finally {
    await blockedStorageContext.close();
  }

  monitorPage(page);
  await page.goto(`${siteOrigin}/en/`);
  await page.keyboard.press('Tab');
  verify(await page.evaluate(() => document.activeElement.classList.contains('skip-navigation-link')),
    '键盘的首个停靠点必须为跳过导航链接');
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.hash === '#main-content');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  verify(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior) === 'auto',
    '减少动态效果设置必须禁用平滑滚动');

  const contrastRatios = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const renderingContext = canvas.getContext('2d', { willReadFrequently: true });
    const luminance = (color) => {
      renderingContext.clearRect(0, 0, 1, 1);
      renderingContext.fillStyle = color;
      renderingContext.fillRect(0, 0, 1, 1);
      const channels = [...renderingContext.getImageData(0, 0, 1, 1).data].slice(0, 3).map(channel => {
        const normalizedChannel = channel / 255;
        return normalizedChannel <= 0.04045 ? normalizedChannel / 12.92
          : ((normalizedChannel + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const styles = getComputedStyle(document.documentElement);
    const backgroundLuminance = luminance(styles.getPropertyValue('--color-page-background'));
    const tintLuminance = luminance(styles.getPropertyValue('--color-brand-tint'));
    return ['--color-body-text', '--color-secondary-text', '--color-brand-primary'].map(token => {
      const foregroundLuminance = luminance(styles.getPropertyValue(token));
      return { token, page: (backgroundLuminance + 0.05) / (foregroundLuminance + 0.05),
        tint: (tintLuminance + 0.05) / (foregroundLuminance + 0.05) };
    });
  });
  verify(contrastRatios.every(ratio => ratio.page >= 4.5 && ratio.tint >= 4.5),
    `正文颜色必须达到 AA 对比度：${JSON.stringify(contrastRatios)}`);
  verify(browserFailures.length === 0, `浏览器或资源请求失败：${browserFailures.join('; ')}`);
  completedChecks.push('键盘导航、减少动态效果、AA 文字对比度与浏览器错误检查通过');
  return { siteOrigin, completedChecks, contrastRatios, browserFailures };
}
