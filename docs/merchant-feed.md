# WorthIt 商家 feed

商家把这份文件交给 WorthIt。解析器只读文件，不访问任何网址，也不抓页面。

示例文件（虚构商家 Sample Store D，不是实时价格）：

- `src/lib/feed/sample-feed.json`
- `src/lib/feed/sample-feed.csv`

`parseFeed` 接受 JSON 数组、`{ "products": [ ... ] }`，或带表头的 CSV。返回 `{ products, errors }`。坏行记入 `errors`，不影响其他行。`row` 从 1 起算：JSON 是数组下标加 1，CSV 是文件行号（第 1 行是表头）。

解析器自己写入 `source: "feed"` 和 `fixture: false`。商家不要在行里提供这两个字段。

## 必填

| 字段 | 规则 |
| --- | --- |
| id | 非空字符串，同一份 feed 内不重复 |
| title | 非空字符串，默认英文 |
| category | 非空字符串，稳定分类名，例如 `laptop` |
| price | 大于 0 的数字，单位 NZD，含 GST |
| currency | 只能是 `NZD` |
| merchant | 非空字符串。示例数据只用虚构店名 |
| url | 商家自己的商品页，必须以 `https://` 开头 |
| imageCount | 大于等于 0 的整数 |
| condition | `new`、`refurbished`、`used` 之一 |
| capturedAt | ISO 日期，`YYYY-MM-DD` 或带时间的 ISO 8601 |

## 选填

| 字段 | 规则 |
| --- | --- |
| title_zh | 简体中文标题 |
| titles | `{ "en": "...", "zh-Hans": "..." }` |
| wasPrice | 数字，NZD |
| imageUrl | `https` 图片地址 |
| specs | 对象。值只能是字符串或数字。CSV 里写成 JSON 字符串 |
| rating | 0 到 5 |
| reviewCount | 大于等于 0 的整数 |
| warrantyMonths | 大于等于 0 的整数 |

## 示例

```json
{
  "id": "sample-lamp-01",
  "title": "Sample desk lamp",
  "title_zh": "示例台灯",
  "category": "furniture",
  "price": 89,
  "currency": "NZD",
  "merchant": "Sample Store D",
  "url": "https://example.com/feed/sample-lamp-01",
  "imageCount": 4,
  "condition": "new",
  "capturedAt": "2026-11-24",
  "specs": { "note": "Example feed row. Not a live price." }
}
```

一条价格为负数、货币不是 NZD、链接不是 https、`imageCount` 不是整数、或日期不是 ISO 的行，会在 `errors` 里按字段各记一条，格式为 `{ row, field, message }`。
