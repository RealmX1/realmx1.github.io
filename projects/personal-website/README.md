# 中英双语个人主页

名片二维码固定入口：**https://realmx1.github.io/**。

- 英文：https://realmx1.github.io/en/
- 简体中文：https://realmx1.github.io/zh/
- GitHub 站点仓库：`RealmX1/realmx1.github.io`

首次发布与线上验收已完成，结果见[实施与验收记录](docs/implementation-validation.md)。

## 本地预览与验证

在仓库根目录运行，静态站点无需安装依赖或构建：

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory projects/personal-website/public
```

访问 http://127.0.0.1:4173/。在另一个终端执行自动化测试：

```sh
node --test projects/personal-website/tests/*.test.mjs
```

浏览器验收使用已安装的 `playwright-cli`，测试函数可同时用于本地预览与上线站点：

```sh
playwright-cli -s=personal-website-verification open http://127.0.0.1:4173/en/
playwright-cli -s=personal-website-verification run-code --filename=projects/personal-website/tests/verify-personal-website-in-browser.js
playwright-cli -s=personal-website-verification close
```

上线后把 `open` 的地址替换为 https://realmx1.github.io/en/，同一套检查即可核验真实页面。

## 内容维护

- `public/en/index.html` 与 `public/zh/index.html` 是各语言完整的静态正文。更新经历或作品时同步修改两份。
- 共用样式、语言偏好脚本和图标位于 `public/assets/`。
- 学历与经历依据用户提供并更正的 LinkedIn 摘要；学校中文名称核对院校官网。作品依据对应仓库 README，fork 保留上游归属。
- Trace of Thought 只展示已确认的项目概要，不提供未经验证的下载或访问地址。
- 统一入口优先使用已保存的语言，其次使用浏览器首选语言，其他语言回退英文。存储不可用时仍可进入站点，无脚本时显示中英入口。
- 没有后端、分析代码、第三方字体、访客端 API 调用或需要配置的密钥。

## 发布与恢复

GitHub Pages 使用 GitHub Actions 作为发布来源。工作流仅把 `public` 目录上传为工件；测试、说明文档与其他项目不进入网站。公开源码仓库本身仍包含这些文件。

`main` 上的站点或测试改动触发验证与发布，PR 只验证和打包，`workflow_dispatch` 可手动重跑。Actions 的版本固定为实施时查证的官方 tag 对应提交。

若发布失败，先读取准确的 run，不重复创建仓库或改写历史：

```sh
gh run list --repo RealmX1/realmx1.github.io --workflow deploy-personal-website-to-github-pages.yml --limit 5
gh run view <run-id> --repo RealmX1/realmx1.github.io --log-failed
```

确认源码与 Pages 配置后，短暂基础设施故障可对同一 run 执行一次 `gh run rerun <run-id> --failed`；权限或配置错误先修正对应设置。之后继续核验运行结果与实际 HTTPS 页面，不能用“已推送”代替“已上线”。
