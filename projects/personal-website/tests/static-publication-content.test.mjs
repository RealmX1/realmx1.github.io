import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const publicDirectory = new URL('../public/', import.meta.url);
const localizedPages = ['en', 'zh'].map(language => ({
  language,
  file: new URL(`${language}/index.html`, publicDirectory),
  content: readFileSync(new URL(`${language}/index.html`, publicDirectory), 'utf8'),
}));

const localizedBlogPages = ['en', 'zh'].map(language => ({
  language,
  file: new URL(`${language}/blog/index.html`, publicDirectory),
}));

test('双语博客入口指向真实列表页，空状态不伪造已发表文章', () => {
  for (const { language, file } of localizedBlogPages) {
    assert.ok(existsSync(file), `${language} 博客列表页必须存在`);
    const content = readFileSync(file, 'utf8');
    assert.match(content, /data-blog-empty-state/);
    assert.doesNotMatch(content, /<time|data-blog-post/);
    assert.match(content, new RegExp(`https://realmx1.github.io/${language}/blog/`));
    assert.match(content, /hreflang="en"[^>]+\/en\/blog\//);
    assert.match(content, /hreflang="zh-CN"[^>]+\/zh\/blog\//);
    assert.match(localizedPages.find(page => page.language === language).content,
      /href="blog\/"/);
  }
});

test('网站反馈实际指向已启用的 Issues，并预填对应页面与语言', () => {
  for (const page of [...localizedPages, ...localizedBlogPages]) {
    assert.ok(existsSync(page.file), '网站页面必须存在');
    const content = readFileSync(page.file, 'utf8');
    const canonicalUrl = content.match(/rel="canonical" href="([^"]+)"/)[1];
    const feedbackReferences = [...content.matchAll(/href="([^"]+)"[^>]*data-website-feedback/g)];
    assert.ok(feedbackReferences.length > 0, '每个页面都必须保留网站反馈入口');
    for (const [, reference] of feedbackReferences) {
      const feedbackUrl = new URL(reference.replaceAll('&amp;', '&'));
      assert.equal(feedbackUrl.origin, 'https://github.com');
      assert.equal(feedbackUrl.pathname, '/RealmX1/realmx1.github.io/issues/new');
      assert.ok(feedbackUrl.searchParams.get('title'));
      assert.ok(feedbackUrl.searchParams.get('body').includes(canonicalUrl));
      assert.ok(feedbackUrl.searchParams.get('body').includes(page.language));
    }
    assert.match(content, page.language === 'zh' ? /公开.*GitHub.*登录/ : /public.*GitHub.*sign.in/i);
  }
});

test('中英双语都保留已更正的本科学位与四段教育经历', () => {
  for (const { language, content } of localizedPages) {
    assert.equal((content.match(/data-education-entry/g) || []).length, 4);
    assert.equal((content.match(/data-undergraduate-degree/g) || []).length, 1);
    assert.match(content, language === 'en'
      ? /Computer Science \+ Philosophy/ : /计算机科学 \+ 哲学/);
    assert.match(content, /datetime="2019-08"/);
    assert.match(content, /datetime="2022-05"/);
    assert.match(content, /datetime="2026-04"/);
    assert.match(content, language === 'en' ? /Doctoral studies/ : /博士阶段/);
    assert.doesNotMatch(content, /3\.79|3\.9\/4/);
  }
});

test('双语页面有五项作品、上游归属和正确语言元信息', () => {
  for (const { language, content } of localizedPages) {
    assert.equal((content.match(/class="project-entry(?: |")/g) || []).length, 5);
    assert.match(content, /https:\/\/github\.com\/cline\/kanban/);
    assert.match(content, /https:\/\/github\.com\/FireRedTeam\/FireRedASR/);
    assert.match(content, new RegExp(`<html lang="${language === 'zh' ? 'zh-CN' : 'en'}">`));
    assert.match(content, new RegExp(`rel="canonical" href="https://realmx1.github.io/${language}/"`));
    assert.match(content, /hreflang="en"/);
    assert.match(content, /hreflang="zh-CN"/);
    assert.doesNotMatch(content, /\/Users\/|localhost|linkedin\.com\/.*details\/education/);
  }
});

test('发布目录中的页面链接与静态资源都存在', () => {
  const pages = [{ file: new URL('index.html', publicDirectory),
    content: readFileSync(new URL('index.html', publicDirectory), 'utf8') }, ...localizedPages,
    ...localizedBlogPages.map(page => ({ ...page, content: readFileSync(page.file, 'utf8') }))];
  for (const { file, content } of pages) {
    for (const [, reference] of content.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (reference.startsWith('#') || /^https?:/.test(reference)) continue;
      const target = new URL(reference, file);
      if (target.pathname.endsWith('/')) target.pathname += 'index.html';
      assert.ok(existsSync(target), `${file.pathname} 中的 ${reference} 必须可访问`);
    }
  }
  assert.ok(existsSync(new URL('.nojekyll', publicDirectory)));
});
