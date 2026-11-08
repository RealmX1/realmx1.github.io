import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('GitHub Actions 固定版本必须是完整的 40 位提交号', () => {
  const workflow = readFileSync(new URL(
    '../../../.github/workflows/deploy-personal-website-to-github-pages.yml', import.meta.url,
  ), 'utf8');
  const actionReferences = [...workflow.matchAll(/^\s+uses: ([^\s@]+)@([^\s#]+)/gm)];
  assert.ok(actionReferences.length > 0, '发布工作流必须使用已固定版本的官方 Action');
  for (const [, actionName, commitRevision] of actionReferences) {
    assert.match(commitRevision, /^[0-9a-f]{40}$/, `${actionName} 的提交号格式必须有效`);
  }
});
