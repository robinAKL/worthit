# WorthIt 值不值

说出你想要的东西，WorthIt 按 **性价比（默认）/ 便宜 / 精致** 三栏帮你排好，每条推荐都写明理由。点击商品后跳转到商家自己的页面下单。

> v0.1 只用**示例数据**：商品、商家和价格都是虚构的，页面上会一直显示提示。

## 开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # 单元测试（解析、打分、排除规则）
npm run build    # 类型检查 + 生产构建
```

## 结构

- `src/lib/types.ts`：数据契约（Product、Lane、Recommendation、SearchResult、`search(query, lane)`）。
- `src/lib/`：示例目录、查询解析、三栏打分和推荐理由。
- `src/App.tsx`、`src/components/`：落地页。
- `src/styles/tokens.css`：设计 token（OKLCH 颜色、字号、间距），遵循 hallmark 设计规则。
- `docs/crawl-allowlist.md`：零售商 robots.txt 和使用条款核查。目前没有一家允许采集。

## 数据原则

只收录商家主动提供、或者明确允许收录的商品。条款或 robots.txt 禁止采集的网站一律不抓取。
