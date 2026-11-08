import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const publicDirectory = new URL('../public/', import.meta.url);
const localizedPages = ['en', 'zh'].map(language => ({
  language,
  file: new URL(`${language}/index.html`, publicDirectory),
  content: readFileSync(new URL(`${language}/index.html`, publicDirectory), 'utf8'),
}));

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
    content: readFileSync(new URL('index.html', publicDirectory), 'utf8') }, ...localizedPages];
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
