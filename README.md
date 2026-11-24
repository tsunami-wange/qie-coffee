# Qie.Coffee｜喫咖啡

一杯上海，万般中国。React + TypeScript + Vite 编写的课程展示点单系统。纯静态网站，无后端、数据库、收费 API、登录或真实支付。实际源代码就在当前项目根目录。

## 启动

需要 Node.js 24（推荐，测试使用其原生 TypeScript 支持）、pnpm 11.25.0 与 Python 3（仅 Excel 导入时需要）。

```sh
pnpm install
pnpm dev
```

浏览器打开终端给出的地址，默认 `http://127.0.0.1:5173`。也可使用 `npm install`、`npm run dev`；GitHub 工作流使用已提交的 pnpm 锁文件。局域网演示可运行 `pnpm dev --host 0.0.0.0` 并通过电脑局域网 IP 访问。

如果在 Codex 内运行，系统 `node` 可能是 App 签名运行时，加载 Rollup 原生模块会因 macOS Team ID 限制失败。使用标准 Node 安装；本次通过以下已配置运行时构建验证：

```sh
/Users/tsunami/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vite/bin/vite.js
```

此绝对路径只是本机环境说明，不是项目依赖；项目在正常 Node 环境运行。

## 已实现

- 品牌首页：三大咖啡系列、实验新品、演示推荐、DIY、甜点与伴手礼入口。
- 63 款固定产品、30 项 DIY 收费选项、14 个子系列；桌面三栏点单、手机横向分类导航及底部购物袋。
- 主/子系列、双语关键词及配料搜索、最高价格、标签筛选，商品详情、适用温度/甜度、数量选择。
- 默认只有源表“首期”可模拟购买；储备、轮换和节令产品仍展示。菜单的全产品演示开关可开放概念购买，概念状态保留在购物袋。开关刷新后恢复关闭。
- DIY 五步：5 基底、10 风味、8 小料、7 装饰，限制 1/2/3/2；实时 SVG 杯子、精确加价、自动长名称、自定义名称、移除与重配。
- 可维护的禁止组合与提醒规则；更换基底也检查规则。明确过敏原、酒酿酒精待核及糯食用勺提示。
- 作品保存、收藏、重编辑、再次加购、PNG 配方卡下载；UUID 设计编号及上海日期。分享卡仅本地生成，没有上传服务。
- 完整购物袋、数量增减删除、堂食/打包、可选昵称/备注、模拟订单、双语电子小票、打印与本地历史。
- 品牌文化、五组地域风味探索、相关产品及本地共创画廊。没有虚构销量、真实用户评论或联网社区。
- 中英文导航、菜单、配料、说明、操作、购物袋、小票与系统提示。用户自填名称/备注保留原文，中文品牌标识也保留。
- localStorage 保存购物袋、语言、作品及订单；存储失败有提示。浏览器清理站点数据将删除这些本地记录。
- 原生 dialog 焦点限制、Escape 关闭、键盘焦点、正文跳转、减少动态效果偏好。

## 结构

```text
src/
  main.tsx                       路由与页面、购物袋和本地状态
  styles.css                     品牌样式、桌面/平板/手机断点
  features/
    logic.ts                     价格、去重、兼容规则、购物袋纯函数
    Cup.tsx                      动态杯子与 Canvas PNG 卡片导出
  data/
    products.json                63 款固定菜单
    diy-options.json             30 项收费选项
    compatibility-rules.json     数量上限、阻断及提醒规则
    editorial.json               分类翻译、文化说明、风味探索
  locales/zh-CN.json              中文界面文案
  locales/en-US.json              英文界面文案
public/images/                   63 个独立 SKU 概念 SVG
scripts/import-menu.py           标准库 XLSX 读取及核对脚本
scripts/translations.json        导入时使用的英文配料、选项与备注翻译
scripts/generate-concepts.py     重新生成本地概念 SVG
 tests/logic.test.ts              核心数据及业务自动化测试
.github/workflows/pages.yml      GitHub Pages 部署
outputs/                        数据核对、验证报告与演示产物
work/                           被 Git 忽略的内部临时处理数据
```

## 数据来源与核对

实际找到并使用的是桌面的 `Qie.Coffee_全部售卖菜单_分类汇总.xlsx` 和用户附加的 `Qie.Coffee菜单及报价表.xlsx`。没有找到需求中名为 `Qie.Coffee_完整菜单与配料预算.xlsx` 的文件。后者实际包含 7 张工作表，涵盖分类菜单、完整 SKU、BOM、DIY 及采购预算，因此用作完整表来源。

分类表垂直合并单元格沿其范围填充；横向合并标题作为主系列边界处理。固定产品的名称、主要配料和售价来自分类表；SKU、英文名、规格、上线建议来自完整菜单。完整表也含相同分类页，两份分类页逐行一致；全部固定和 DIY 售价与详细表一致。完整表的短分类名（如“经典”“中国风味基础”）采用汇总页完整显示名归类。上线状态是课程演示逻辑，不是实际营业承诺。

`outputs/data-audit.json` 列出来源文件、各类数量和冲突。当前数量为 63 / 30 / 14，冲突为 0。备注不用于覆盖用户开发要求。经营性 BOM、采购成本、采购用量、预计销量不导出到浏览器，Excel 也不拷贝到项目。导入只输出明示允许的字段。套餐组成按原表固定，不提供未经定价的替换。

## 更新菜单

可直接编辑 `src/data/products.json` 的 `price`、`status`、`image` 等字段。`status` 为 `available`（首期）、`concept`（储备）或 `rotation`（轮换）；`seasonal` 独立标记季节限定。名称、配料、规格、说明和备注均使用 `{ "zh": "…", "en": "…" }`。

Excel 作为主数据源时运行：

```sh
python3 scripts/import-menu.py "/path/Qie.Coffee_全部售卖菜单_分类汇总.xlsx" "/path/Qie.Coffee菜单及报价表.xlsx"
pnpm test
pnpm build
```

导入脚本零第三方 Python 依赖，可读取共享字符串或内联字符串。保持工作表顺序/列结构：分类页第 1 张、固定 SKU 第 2 张、DIY 模块第 4 张。重导入会覆盖 products 和 diy-options；需持续保留的改动应回写 Excel 或导入脚本/翻译配置。源表价格或分类页冲突时输出报告并停止，不写产品数据。数量异常时同样停止。新增产品应同步调整数量断言及测试，不能为凑数删减数据。新配料的英文需要加入 translations.json；测试会检查英文配料中的未翻译中文。

当前主要配料按菜单汇总，不把详细 BOM 中包装、水量及经营用量当作消费者配料。成品/复合原料供应商完整成分尚未提供，过敏原清单不作“无过敏原”保证；直接明确原料标记乳制品、芝麻、大豆，未确认成品以提示呈现。

## 图片与文化文案

每个 SKU 的 `image` 指向 `public/images/<SKU>.svg`，每款有独立文件，全部为概念插画。替换照片时放到 `public/images/`，修改对应 JSON 的相对路径，例如 `images/C08.jpg`，不要以 `/` 开头。无需外网图片或付费服务。

`python3 scripts/generate-concepts.py` 会覆盖同名概念 SVG，请在替换真实图片后谨慎运行。风味故事、地域产品关联与分类英文维护在 editorial.json。产品介绍为基于配料的概念描述，不代表感官测试结论。品牌叙事根据课程设定写作；上海西式糕点文化参考上海市政府的 [蝴蝶酥介绍](https://english.shanghai.gov.cn/en-GlobalTasteinShanghai2026-LocalFlavors/20260416/b2c7838bef6944fba895deb8a17e4698.html)。风味探索是地域灵感，不宣称创新咖啡为当地传统饮品。具体食材产地须以未来采购标签核实。

字体采用系统 Arial / PingFang SC / Microsoft YaHei / Georgia / Songti SC / SimSun 回退，不分发第三方字体文件。

## DIY 维护

选项价格在 `diy-options.json`，或修改 Excel 重导入。`group` 为 B（基底）、F（风味）、T（小料）、P（装饰），ID 不要随意更改。规则结构：

```json
{"id":"example","severity":"warning","any":["F09"],"with":["F03","F04"],"zh":"提示","en":"Notice"}
```

`any` 至少命中一项，并且 `with` 命中一项时生效；空 with 为单项提示。`severity: block` 阻断新增组合，`warning` 仅提醒。当前牛乳基底与山楂/酒酿阻断，乳制小料相关组合提醒；这属于保守概念展示规则，没有食品安全或口味验证认证。透明杯及分层为概念示意。适合的冷热和甜度是界面可维护的演示规格，正式制作前需配方确认。

购物袋 key 包含 SKU 与规格；DIY key 包含排序去重后的选项 ID 和自定义名称，因此不同配方不会误合并。价格按所选不同 ID 求和，基底不重复计费。作品重新编辑后保存更新同一设计编号；点击“重新搭配”生成新编号。

## 构建、验证与 GitHub Pages

```sh
pnpm typecheck
pnpm test
pnpm build
```

静态产物位于 `dist/`。Vite 使用 `base: './'`，图片基于 `import.meta.env.BASE_URL`，页面使用 `#menu` 等 Hash 路由，支持 GitHub Pages 项目子路径与刷新。

将项目上传自己的 GitHub 仓库，在 Settings → Pages → Source 选择 GitHub Actions；推送 main 或手动运行 Deploy GitHub Pages。工作流安装、测试、构建，仅发布 dist。无需发布 Excel、work 或 outputs。已提供工作流，尚未连接用户仓库或实际部署到 GitHub。

手机和电脑使用同一个响应式网站、同一个 GitHub Pages 网址，不需要分别上传或建立两个仓库。一次上传的逐项清单和操作步骤见 [GITHUB_UPLOAD.md](GITHUB_UPLOAD.md)。

查看 `outputs/verification.md` 获取本次验证范围。自动化测试覆盖数据数量、所有 DIY 单项加价、去重、各组上限、双向组合限制、购物袋独立配方及内部经营字段检查；浏览器验证覆盖搜索、全部分类、规格、持久化、PNG 下载、模拟订单和手机布局。

## 后续需要补充

真实产品照片、成品供应商成分/过敏原标签、酒酿实际酒精含量、最终配方容量/温度/甜度、实测稳定性与感官结果、实际营业上架计划。套餐及所有 Lab/Mix 都是课程设定的概念；代码不接真实支付。删除浏览器站点存储可重置课堂测试订单和作品。
