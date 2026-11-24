# 新西兰零售商采集白名单（robots.txt 与使用条款核查）

核查日期：2026-11-24。负责人：Claude（T-08），验证人：Grok。

> **上线前需请新西兰律师复核。** 本文件是技术和条款层面的初筛，不是法律意见。

## 核查方法

- 每家只读取了 `robots.txt` 和使用条款页面。没有访问任何商品页，也没有采集商品数据。为了找条款链接访问过 4 个首页，其中 3 个被反爬质询页拦截，我们没有尝试绕过。
- 引文标注两种来源：
  - **【直取】**：从原始 HTML 中逐字核对过。
  - **【摘录】**：由抓取工具摘录，因为页面对直接请求返回 403，或者正文靠 JS 渲染。这类引文需要有人用浏览器人工复核。
- 结论只有三种：
  - **允许**：robots 放行商品页，且条款里没有反爬或商业使用限制。
  - **禁止**：robots 禁止商品页，或条款明文禁止自动采集。
  - **不明确**：读不到条款，或条款有商业使用/复制限制但没有明文提到自动化。**不明确按禁止处理。**

## 结论汇总

| 零售商 | robots 对商品页 | 条款要点 | API / feed / 联盟 | 结论 |
|---|---|---|---|---|
| Woolworths NZ | 放行（禁 `/shop/search`） | "neither the Site, nor any material on it, may be scraped"【直取】 | 未见 | **禁止** |
| Pak'nSave | 放行（禁 `/search`、`/shop/search`） | 没有自动化条款；复制、转载需明确许可；网购条款只授权自用 | 未见 | **不明确** |
| New World | 放行（另禁 `/product-promotions`） | 与 Pak'nSave 相同（Foodstuffs 模板） | 未见 | **不明确** |
| The Warehouse | 放行（禁搜索和价格筛选参数；约 100 个通用爬虫 UA 被全禁） | 集团条款：只能用浏览器或官方 App 访问【摘录】；帮助中心条款是 JS 页面，读不到 | 未见 | **不明确**（倾向禁止） |
| Warehouse Stationery | 同上 | 集团条款同上；Terms of Use 禁止"for commercial purposes"转载【摘录】 | 未见 | **不明确**（倾向禁止） |
| Noel Leeming | 同上 | 集团条款明确适用于 Noel Leeming【摘录】；站点返回质询页 | 未见 | **不明确**（倾向禁止） |
| PB Tech | 放行（禁 `/search*`；GPTBot、CCBot、ClaudeBot 等全禁；`ai-train=no`） | "use any automated tool to access, copy, extract or monitor Website Data"【直取】，明确包括比价用途 | 只有批发账户协议 | **禁止** |
| Mighty Ape | 放行（禁 `/api`、搜索和筛选参数） | 禁止用自动化手段访问、搜索或使用网站，官方界面和 API 除外【直取】 | 条款提到官方 API，但没有公开文档 | **禁止** |
| JB Hi-Fi NZ | 放行（Shopify；禁 `/search`、`/*?q*`） | 条款页是 JS 单页应用，读不到 | 未见 | **不明确** |
| Kmart NZ | 据摘录为放行（直接请求返回 403） | "data mining, bots, spiders, automated tools"被禁止【摘录】 | 未见 | **禁止** |
| Bunnings NZ | 部分商品类目路径被禁（如 `/indoor-living*`） | 只许个人使用，禁止复制【直取】 | 未见 | **禁止** |
| Harvey Norman NZ | 放行（只禁排序和筛选参数） | 禁止"commercialise any information obtained from any part of this website"【直取】；只许个人、非商业使用 | 未见 | **不明确** |

**结果：允许 0 家，禁止 5 家，不明确 7 家。**

## 对 WorthIt 的含义

1. 这 12 家主要零售商**目前都不能用爬虫采集**。不明确的一律按禁止处理。
2. 没有一家提供公开的商品 API 或数据 feed。
3. 有几家的条款写明"未经书面许可"不得采集，例如 Woolworths、PB Tech、Harvey Norman、Foodstuffs。也就是说，**拿到书面许可就可以**。下一步应该逐家联系，申请数据合作或书面许可。
4. 采集器代码不进入仓库，直到某家的结论变成"允许"，或者拿到书面许可。
5. 以后新增商家时，用同样的方法核查后再加入本表。

## 来源链接

- Woolworths：https://www.woolworths.co.nz/robots.txt ，https://www.woolworths.co.nz/help/terms-conditions/online-shopping-website-app
- Pak'nSave：https://www.paknsave.co.nz/robots.txt ，https://www.paknsave.co.nz/terms-and-conditions ，https://www.paknsave.co.nz/shop/terms-and-conditions
- New World：https://www.newworld.co.nz/robots.txt ，https://www.newworld.co.nz/terms-and-conditions
- The Warehouse 集团：https://www.thewarehouse.co.nz/robots.txt ，https://www.warehousestationery.co.nz/c/terms-and-conditions ，https://www.warehousestationery.co.nz/terms/terms-of-use.html
- Noel Leeming：https://www.noelleeming.co.nz/robots.txt
- PB Tech：https://www.pbtech.co.nz/robots.txt ，https://www.pbtech.co.nz/help/article/87/terms-and-conditions
- Mighty Ape：https://www.mightyape.co.nz/robots.txt ，https://help.mightyape.co.nz/hc/en-nz/articles/115012110928-Terms-Conditions
- JB Hi-Fi：https://www.jbhifi.co.nz/robots.txt
- Kmart：https://www.kmart.co.nz/robots.txt ，https://www.kmart.co.nz/terms-and-conditions/
- Bunnings：https://www.bunnings.co.nz/robots.txt ，https://www.bunnings.co.nz/terms-conditions/website-terms-of-use
- Harvey Norman：https://www.harveynorman.co.nz/robots.txt ，https://www.harveynorman.co.nz/corporate-information/terms-of-use.html
