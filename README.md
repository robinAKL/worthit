# WorthIt 值不值

说出你想要的东西，WorthIt 按 **性价比（默认）/ 便宜 / 精致** 三栏帮你排好，每条推荐都写明理由。点击商品后跳转到商家自己的页面下单。

> v0.1 只用**示例数据**：商品、商家和价格都是虚构的，页面上会一直显示提示。

v0.2 默认英语，支持简体中文。导航栏可随时切换，保留搜索和栏目；语言选择顺序为有效的 `?lang=`、本地保存的选择、浏览器语言、英语。

新增语言：在 `src/lib/types.ts` 的 `Locale` 和 `LOCALES` 登记 ID，新增一个以 `Copy` 为类型的字典文件，在 `src/i18n/registry.ts` 的 `DICTIONARIES` 登记，并补齐商品标题和理由的翻译。类型检查会检测缺失的字典和文案键。详见 [语言维护说明](src/i18n/README.md)。

租金对照使用 Tenancy Services 按地区（territorial authority）公布的月度押金 CSV。当前文件是 2026-11-24 从官网下载的，数据月份为 2026-09。这份月度文件没有卧室数列，所以工具里的卧室数只有“全部”会给出区间。许可是 CC BY 3.0 NZ，署名 MBIE。重新生成数据：

```bash
node scripts/build-rent-data.mjs
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
- `docs/crawl-allowlist.md`：零售商 robots.txt 和使用条款核查。目前没有一家允许采集。

## 数据原则

只收录商家主动提供、或者明确允许收录的商品。条款或 robots.txt 禁止采集的网站一律不抓取。
