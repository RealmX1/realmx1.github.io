# 个人主页实施与验收记录

验收日期：2026-11-08 UTC（洛杉矶时间 2026-11-07）。

## 交付与发布

- 统一二维码入口：https://realmx1.github.io/
- 完整英文版：https://realmx1.github.io/en/
- 完整简体中文版：https://realmx1.github.io/zh/
- 公开源码：https://github.com/RealmX1/realmx1.github.io
- 本地任务分支：`task-aa0dc-bilingual-personal-website`；远端发布分支：`main`。
- 发布候选提交：`2fb8470d8b89826c7d654dd21f2db671249a78cb`。
- [发布运行 42434823251](https://github.com/RealmX1/realmx1.github.io/actions/runs/42434823251) 的验证、打包和部署均成功。
- Pages 控制面确认：`build_type=workflow`、`https_enforced=true`、`status=built`。

## 需求符合情况

- 个人主页独立放在 `projects/personal-website/`，无需后端或运行时依赖。
- 两种语言包含同样的五项作品、四段教育和三段研究／创业经历。
- 学历使用用户最后更正的记录，本科仅保留 Computer Science + Philosophy 一项，博士阶段明确标记在读。
- 作品介绍依据仓库 README；Cline Kanban 和 FireRedASR-App 保留上游归属，Trace of Thought 标记开发中。
- 文明持续存在作为最高价值的表述以中英文呈现。
- 统一入口记住语言偏好，存储不可用与 JavaScript 禁用时仍可访问正文。
- 只把 `public` 目录打包为 Pages 工件，其他项目、测试和说明文档不进入网站。

## 已完成的验证

| 验证 | 结果 |
| --- | --- |
| Node.js 自动化测试 | 11 项通过，包含语言路由、存储失败恢复、学历修正、上游归属、资源完整性和 Action 提交号格式 |
| GitHub Actions | 11 项测试通过，静态工件发布成功 |
| 本地与线上浏览器 | 同一套 Playwright 检查均通过 |
| 移动与桌面布局 | 中英文分别验证 320、390、768、1280px 宽度，均无横向溢出 |
| 语言切换 | 自动选择、手动切换和返回统一入口后的偏好恢复通过 |
| 无脚本与禁用存储 | 两种场景都能进入完整正文并继续使用站点 |
| 键盘与减少动态效果 | 跳过导航链接可用，减少动态效果时禁用平滑滚动 |
| 文字对比度 | 正文约 16.92:1，辅助文字约 7.11:1；价值说明底色上的最低文字对比度约 6.41:1 |
| 浏览器错误 | 无脚本错误、控制台错误或站内资源 HTTP 错误 |
| 线上文件一致性 | HTTPS 读取入口、中英文页面、CSS、JavaScript 和 SVG，与本地文件逐字节一致 |
| 源码基本检查 | JavaScript 语法、工作流 YAML 结构与 Git 空白检查通过 |

浏览器环境：Playwright CLI，HeadlessChrome 157；实体手机与其他浏览器尚未实测。

复现命令见[项目说明](../README.md)。上述浏览器检查验证了已列场景，不等同完整 WCAG 审计。

## 首次发布问题与恢复

[初次自定义运行 42434709812](https://github.com/RealmX1/realmx1.github.io/actions/runs/42434709812) 因 `checkout` 固定提交号多出一个字符而失败。后续修正为从官方仓库核对的 40 位提交号，并新增回归测试；保留原始失败记录。GitHub 自动启用的默认分支发布方式已改为指定工作流，最终上线内容来自验证成功的个人站点工件。

教育和经历来自用户直接提供并更正的 LinkedIn 摘要；本次没有声称绕过 LinkedIn 的自动访问限制。
