# WorthIt 值不值

说出你想要的东西，WorthIt 按 **性价比（默认）/ 便宜 / 精致** 三栏帮你排好，每条推荐都写明理由。点击商品后跳转到商家自己的页面下单。

> v0.1 只用**示例数据**：商品、商家和价格都是虚构的，页面上会一直显示提示。

v0.2 默认英语，支持简体中文。导航栏可随时切换，保留搜索和栏目；语言选择顺序为有效的 `?lang=`、本地保存的选择、浏览器语言、英语。

新增语言：在 `src/lib/types.ts` 的 `Locale` 和 `LOCALES` 登记 ID，新增一个以 `Copy` 为类型的字典文件，在 `src/i18n/registry.ts` 的 `DICTIONARIES` 登记，并补齐商品标题和理由的翻译。类型检查会检测缺失的字典和文案键。详见 [语言维护说明](src/i18n/README.md)。

租金对照有两层，都在 2026-11-24 下载：

- 郊区：Tenancy Services 季度押金文件的最新季度（2026-07-01 起），按 SA2、房型、卧室数各取一行。样本是当季新登记押金（Total Bonds），不是全部在册押金。少于 5 笔新登记，或四分位数被抑制时，页面写明数据不足，并回退到下面的地区结果。不跨 SA2 合并四分位数。
- 地区：月度 territorial authority 文件，数据月份 2026-09，没有卧室列，只作为全部卧室的回退。

郊区名称和所属地区来自 Stats NZ「Statistical Area 2 Higher Geographies 2019 (generalised)」，datafinder layer 98779，CC BY 4.0，署名 Stats NZ。押金数据 CC BY 3.0 NZ，署名 MBIE。

重新生成：把季度 CSV 放在 `scripts/cache/quarterly.csv`，把 layer 98779 的属性 CSV 放在 `scripts/cache/sa2-2019.csv`，然后运行：

```bash
node scripts/build-rent-data.mjs
node scripts/build-rent-sa2.mjs
```

## 开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # 单元测试（解析、打分、排除规则）
npm run build    # 类型检查 + 生产构建
```

## 结构

- `src/lib/types.ts`：数据契约（Product、Lane、Recommendation、SearchResult、`search(query, lane, locale?)`）。
- `src/lib/`：示例目录、查询解析、三栏打分和推荐理由。
- `src/App.tsx`、`src/components/`：落地页。
- `src/styles/tokens.css`：设计 token（OKLCH 颜色、字号、间距），遵循 hallmark 设计规则。
- `docs/crawl-allowlist.md`：零售商 robots.txt 和使用条款核查。书面授权仍然是零。
- `scripts/collect/`：试点采集。`sites.json` 里每家有独立开关，运行前读取当天的 robots.txt。

## 数据原则

只收录商家主动提供、或者明确允许收录的商品。条款或 robots.txt 禁止采集的网站一律不抓取。试点脚本只保留名称、品牌、型号、价格、库存、规格、商品链接和采集时间。

重跑试点（每家最多 50 个商品）：

```bash
node --experimental-strip-types scripts/collect/run.mjs --limit=50
```

## 每日更新

`.github/workflows/refresh.yml` 默认只能手动运行：GitHub → Actions → Refresh data → Run workflow。定时那一段是注释，所以不会自己跑。

Robin 要做两件事：

1. 仓库 Settings → Secrets and variables → Actions，添加 secret `AI_GATEWAY_API_KEY`。没有这个 secret 时，采集照常进行，规格补抽会跳过。
2. 要每天新西兰时间凌晨自动跑，去掉 `refresh.yml` 里 `schedule` 两行的注释。`0 11 * * *` 在夏令时（UTC+13）是午夜，在标准时间是凌晨 1 点。

采集遇到 403、429 或空结果时，不覆盖已有 feed。一件商品或一辆车连续 3 次完整采集都没有出现，才从 feed 里删除。价格历史保留。运行日志会写出每个站的请求数、跳过数和错误数。
