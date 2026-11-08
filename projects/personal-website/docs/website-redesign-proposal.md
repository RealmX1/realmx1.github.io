# 个人主页改版提案

更新日期：2026-11-08。状态：已实施并发布。用户以“sure proceed”批准承接推荐方案 D，反馈采用推荐的 GitHub Issues。结果见[改版发布验收](website-redesign-publication-validation.md)。

## 用户已确认的要求

- 保留简洁的中英双语个人网站、真实学历与作品、文明存续价值表达，以及固定入口 https://realmx1.github.io/。
- 改善整体字号、视觉设计和手机操作体验。
- 用户原话：“do not use purple. do not use blue. not as the main color.”
- 用户原话：“also leave place for blogs. if it is possible, have an entry where feed back reagrding the website can be received.”

这两条补充来自本任务当前对话，覆盖初版产品约定中的相应范围。以下方案已进入实施；C 与私密表单保留为讨论过的替代方向。

## 视觉与阅读建议

- 主色采用炭黑与中性白，朱红用于少量重点；自定义界面不使用紫色、蓝色或偏蓝的灰色。
- 探索两种构图：C 为炭黑首屏与浅色正文，D 为全浅色页面与主作品画面并置。博客文章正文都采用浅色阅读区。
- 桌面正文 20px，手机正文 18px，日期与作品归属至少 16px；标题依靠字号与字重形成清晰层级。
- 英文字体建议 Hanken Grotesk，中文使用清晰的系统黑体；分别处理中文行距、长英文项目名及学校名的断行。
- 主要点击区域至少 44×44px，常用按钮高 48px；语言切换与联系入口在首屏可达。
- 以一个主作品图文展示建立视觉重点，其余作品采用有疏密变化的简洁条目。视觉探针中的软件画面为示意，不作为真实产品截图或功能证据。
- 文明存续理念以一句完整正文融入介绍，保留用户本义。

视觉方向草图由内置 `imagegen` 生成，已保存在本项目中：

- [方案 C：炭黑与朱红，桌面与手机](design-direction-studies/charcoal-vermilion-desktop-and-mobile.png)
- [方案 D：中性白与朱红，桌面与手机](design-direction-studies/neutral-white-vermilion-desktop-and-mobile.png)

当前采用 D，理由是浅色阅读区更适合后续博客与手机浏览。草图用于比较构图、主色和信息层级；生成文字、示意软件、颜色细节与实际像素尺寸均不能直接作为最终实现依据。生成提示要求不使用蓝紫色，保留大字号、可点击入口、无文章时的真实空状态和明确的“界面示意”标识。

## 博客预留

- 导航增加“博客 / Blog”，首页作品区后预留最近文章区域。
- 规划独立列表页 `/en/blog/` 与 `/zh/blog/`，使用相同的导航、字号和阅读宽度。
- 尚无文章时明确显示“文章正在整理，之后会在这里更新”，不虚构文章标题、发布日期或阅读时长。
- 首版只预留列表与文章版式；发布文章时再按真实内容补充，不在本轮引入 CMS 或账户系统。
- 每个可点击入口都必须指向真实页面，不能以无效链接充当预留位置。

## 网站反馈

已核验：站点公开仓库 `RealmX1/realmx1.github.io` 的 Issues 已启用。未登录访问新建 Issue 页面会进入 GitHub 登录页。核验只读，未提交反馈或修改仓库设置。

| 方案 | 访客体验 | 接收方式与维护 |
| --- | --- | --- |
| GitHub Issues，建议的最简首版 | 需要 GitHub 登录，内容公开 | 反馈进入现有站点仓库，无需额外表单服务 |
| 私密表单，可选 | 无需 GitHub 登录，内容不作为公开 Issue 展示 | 需配置 Formspree 等表单服务的账户、接收端点与收件设置 |

- 页脚与联系区提供“网站反馈 / Website feedback”入口。
- 采用 GitHub Issues 时可预填标题、当前页面链接和语言，文案明确提示公开提交；按钮应写“前往 GitHub 提交反馈”，不能显示“已发送”。
- 采用私密表单时需设计提交中、成功与失败状态，并在接收端实际确认收到测试提交后才宣称可用；服务未接通时不展示可提交的空壳表单。
- GitHub Pages 提供静态托管，反馈存储由所选接收服务承担。

## 改版实施时的验收

- 双语页面、博客空状态与语言切换完整；原学历、项目归属及在读状态准确。
- 在 320、390、768、1280px 检查内容、长标题、缩放、点击区域、对比度、键盘焦点和减少动态效果设置。
- 博客入口实际可访问；反馈入口到达正确接收位置，不把打开页面视为提交成功。
- 改版使用已授权的 GitHub Pages 发布目标；验收依据绑定到实现提交、精确发布运行和实际 HTTPS 页面。

## 查证来源

- [GitHub Pages 的静态托管方式](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Issues 的创建与 URL 预填参数](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue)
- [Formspree 的 HTML 表单接入](https://help.formspree.io/articles/building-your-form/building-an-html-form/)
