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
  const verifyReadingAndTouchTargets = async (visitedPage) => {
    const observations = await visitedPage.evaluate(() => {
      const essentialText = [...document.querySelectorAll('.project-category, .project-provenance, .timeline-period, .current-affiliation, .feedback-disclosure, .site-footer')];
      const readingText = [...document.querySelectorAll('.personal-description, .project-description, .contact-description, .blog-page-description, .blog-empty-state p, .blog-preview-section p')];
      const bodyFontSize = parseFloat(getComputedStyle(document.body).fontSize);
      const controls = [...document.querySelectorAll('.site-identity, .section-navigation a, .language-navigation a, .button-link, .contact-links a')];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        bodyFontSize,
        smallReadingText: readingText.filter(element => parseFloat(getComputedStyle(element).fontSize) < bodyFontSize).map(element => element.className),
        smallText: essentialText.filter(element => parseFloat(getComputedStyle(element).fontSize) < 16).map(element => element.className),
        smallControls: controls.filter(element => {
          const box = element.getBoundingClientRect();
          return box.width < 43.9 || box.height < 43.9;
        }).map(element => ({text: element.textContent.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height})),
      };
    });
    verify(!observations.overflow, '页面不得横向溢出');
    verify(observations.bodyFontSize >= 18, '正文不得小于 18px');
    verify(observations.smallReadingText.length === 0, `实际正文应使用页面阅读字号：${observations.smallReadingText}`);
    verify(observations.smallText.length === 0, `辅助信息不得小于 16px：${observations.smallText}`);
    verify(observations.smallControls.length === 0, `主要点击区域不得小于 44px：${JSON.stringify(observations.smallControls)}`);
  };

  for (const locale of ['en-US', 'zh-CN']) {
    const context = await browser.newContext({ locale, viewport: { width: 1280, height: 960 } });
    try {
      const visitorPage = await context.newPage();
      monitorPage(visitorPage);
      const languagePath = locale === 'zh-CN' ? '/zh/' : '/en/';
      await visitorPage.goto(`${siteOrigin}/`);
      await visitorPage.waitForURL(url => url.pathname === languagePath);
      await visitorPage.evaluate(() => document.fonts.ready);
      verify(await visitorPage.locator('h1').textContent() === 'Bomin Zhang', '首页必须显示姓名');
      verify(await visitorPage.locator('.project-entry').count() === 5, '必须展示五项作品');
      verify(await visitorPage.locator('[data-education-entry]').count() === 4, '必须展示四段学历');
      verify(await visitorPage.locator('[data-undergraduate-degree]').count() === 1, '本科条目不得重复');
      verify(await visitorPage.locator('.ongoing-status').textContent() ===
        (locale === 'zh-CN' ? '在读' : 'In progress'), '博士阶段必须标明在读');

      for (const width of [320, 390, 768, 1280]) {
        await visitorPage.setViewportSize({ width, height: 960 });
        await verifyReadingAndTouchTargets(visitorPage);
      }
      await visitorPage.evaluate(() => { document.body.style.zoom = '2'; });
      verify(await visitorPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        '桌面 200% CSS 缩放模拟不得横向溢出');
      await visitorPage.evaluate(() => { document.body.style.zoom = ''; });
      completedChecks.push(`${locale}：入口、正文、学历、四种屏幕宽度、字号、点击区域与 200% CSS 缩放模拟通过`);

      await visitorPage.locator('.section-navigation a[href="blog/"]').click();
      await visitorPage.waitForURL(url => url.pathname === `${languagePath}blog/`);
      verify(await visitorPage.locator('[data-blog-empty-state]').isVisible(), '博客必须显示真实空状态');
      verify(await visitorPage.locator('time').count() === 0, '博客不得伪造已发表文章日期');
      for (const width of [320, 390, 768, 1280]) {
        await visitorPage.setViewportSize({ width, height: 960 });
        await verifyReadingAndTouchTargets(visitorPage);
      }
      const feedbackDetails = await visitorPage.locator('[data-website-feedback]').first().evaluate(element => {
        const destination = new URL(element.href);
        return {origin: destination.origin, path: destination.pathname, body: destination.searchParams.get('body'), page: document.querySelector('link[rel="canonical"]').href};
      });
      verify(feedbackDetails.origin === 'https://github.com' && feedbackDetails.path === '/RealmX1/realmx1.github.io/issues/new', '反馈必须到达正确的站点仓库');
      verify(feedbackDetails.body.includes(feedbackDetails.page), '反馈必须预填当前博客页面');
      await visitorPage.locator('.language-navigation a:not([aria-current])').click();
      const alternateBlogPath = locale === 'zh-CN' ? '/en/blog/' : '/zh/blog/';
      await visitorPage.waitForURL(url => url.pathname === alternateBlogPath);
      verify(await visitorPage.locator('[data-blog-empty-state]').isVisible(), '博客换语言后仍须停留在博客');
      await visitorPage.locator('.back-to-home-link').click();
      await visitorPage.waitForURL(url => url.pathname === (locale === 'zh-CN' ? '/en/' : '/zh/'));
      completedChecks.push(`${locale}：博客导航、空状态、双语对应页、返回首页和反馈预填通过`);
      await visitorPage.goto(`${siteOrigin}${languagePath}`);

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
    await noScriptPage.locator('.section-navigation a[href="blog/"]').click();
    verify(await noScriptPage.locator('[data-blog-empty-state]').isVisible(), '无脚本时博客仍可访问');
    verify(await noScriptPage.locator('[data-website-feedback]').count() > 0, '无脚本时仍须保留反馈入口');
    completedChecks.push('禁用 JavaScript：入口、正文、语言切换、博客与反馈入口通过');
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
