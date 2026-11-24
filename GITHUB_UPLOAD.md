# 一次上传到 GitHub，手机和电脑共用一个网址

本项目已经是响应式网站。把下面这一份项目上传到一个 GitHub 仓库，GitHub Pages 会自动构建；手机和电脑访问的是同一个网址，页面会随屏幕宽度调整。

## 推荐上传内容

使用 `outputs/github-upload/` 中的**全部内容**作为新 GitHub 仓库的根目录（不要把 `github-upload` 本身多套一层）：

```text
.github/workflows/pages.yml  GitHub Pages 自动部署
.gitignore                   排除临时文件
GITHUB_UPLOAD.md             本说明
README.md                    项目与维护说明
index.html                   网页入口
package.json                 依赖和命令
pnpm-lock.yaml               固定依赖版本
pnpm-workspace.yaml          pnpm 构建配置
tsconfig.json                 TypeScript 配置
vite.config.ts               Vite 路径配置
public/images/               63 张独立概念插画
src/                         页面、样式、菜单 JSON、DIY、购物袋、翻译
scripts/                     Excel 重新导入和概念插画生成脚本
tests/                       菜单与价格规则测试
```

上述每一项都已放进 `outputs/github-upload/`；也有同内容的 `outputs/qie-coffee-github.zip` 方便下载或传送。**上传到 GitHub 前先解压，上传解压后的文件**；把 ZIP 直接当作仓库文件上传不会自动部署网站。

不需要上传 `node_modules/`、`dist/`、`work/`、`outputs/`、原始 Excel、`.openai/` 或任何本地订单记录。GitHub Actions 会从源码生成 `dist/`，网站本地订单记录仅保存在每位访问者自己的浏览器中。

## 一次推送

1. 在 GitHub 新建一个空仓库，例如 `qie-coffee`，不要勾选自动生成 README、`.gitignore` 或许可证。
2. 打开解压后的 `github-upload` 文件夹，在该文件夹执行以下命令。将仓库地址改成你自己的：

```sh
git init
git add .
git commit -m "Build Qie.Coffee responsive ordering site"
git branch -M main
git remote add origin https://github.com/你的用户名/qie-coffee.git
git push -u origin main
```

3. 进入该仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。若工作流尚未运行，进入 **Actions → Deploy GitHub Pages → Run workflow** 手动运行一次。等待工作流显示成功。
4. GitHub Pages 网址通常是 `https://你的用户名.github.io/qie-coffee/`，具体以仓库 **Settings → Pages** 显示的网址为准。将这个**同一个网址**发到手机或在电脑打开。GitHub 免费计划下，仓库可见性和 Pages 可用性以账号当前设置为准。

网站使用相对资源路径和 `#menu` 等页面地址。例如手机直接点单可打开 `https://你的用户名.github.io/qie-coffee/#menu`。更换仓库名时无需改 Vite 的 `base: './'`。

## 本地预览

```sh
pnpm install
pnpm dev
```

开发预览默认 `http://127.0.0.1:5173/`，仅在本机服务运行时有效。课程演示的已发布预览链接在交付消息中提供；它与 GitHub Pages 是两套托管地址，页面内容来自同一个响应式项目。
