# 新西兰零售商采集规则核查（T-08）

核查日期：2026-11-24（Pacific/Auckland）  
负责人：Codex；独立复核人：Grok  
范围：WorthIt 在没有零售商书面授权时，自动读取商品资料并在自己的商业导购网站展示、比较及跳转。

**本轮没有找到可直接加入采集白名单的零售商。上线前需请新西兰律师复核。**

这里的“禁止”表示已读条款限制拟议用途，尚未取得例外授权；“不明确”表示证据不足，工程上按禁止处理。它们不是法院对价格事实、著作权、合同效力的裁判。仅有价格事实、自己撰写的评价、复制商品图片/描述，法律问题并不相同。当前拟议的商品卡片和自动目录不能把这几类混为一谈。

## 判定方法与证据边界

- 仅向明确列出的 robots.txt、使用条款及条款目录发出只读请求，并检索公开政策资料；没有请求商品详情、商品列表、搜索接口、库存接口、购物车或结账接口，没有采集商品数据。政策页附带的通用导航不作为商品证据。
- robots 的一般规则 `User-agent: *` 与指定爬虫组分别处理。“未列出商品页禁令”仅说明该 robots 文本未阻止某类路径，**不表示获得商业复制、缓存、转载或比价授权**。特定代理的放行也不能移用到自建爬虫。
- 本轮没有更改 User-Agent、登录、绕过验证码或其他访问限制。访问失败保留失败状态，不能推出“没有条款/没有 robots”。
- 引文仅为短片段，每条条款摘录不超过 15 个英文词；旁边用中文解释上下文，完整内容以来源页面为准。
- API / feed / 联盟计划的“未核实”表示本轮没有取得**可供 WorthIt 使用的官方产品及价格数据许可**，不表示商家内部不存在 API，也不证明商家没有任何合作项目。本轮没有申请账号、接受合同或联系商家。
- 本地请求日志及 robots 文本见 [crawl-evidence/manifest.json](crawl-evidence/manifest.json)。政策正文只保留短摘录，不随报告复制完整网页。部分站点本地访问失败而浏览工具可读，以下逐项注明；本地 200 的页面也可能只有错误壳。普通浏览器补查记录见 [browser-checks.md](crawl-evidence/browser-checks.md)，其成功读取结果优先于早先工具失败记录；没有绕过访问限制。

## 汇总

| 零售商 | 结论 | 当前采集开关 | 决定性依据 |
|---|---|---|---|
| Woolworths NZ | 禁止 | 关闭 | 通用条款 §6 明确限制 scraping，§8 还限制超链接 |
| PAK'nSAVE | 禁止 | 关闭 | 网站 §5、网购 §10–11 限制复制/重发；robots 已由浏览器补齐 |
| New World | 禁止 | 关闭 | 网站 §5、网购 §10–11 限制复制/重发 |
| The Warehouse | 禁止 | 关闭 | 集团通用条款 §15 限制复制内容，适用范围列出该品牌 |
| Warehouse Stationery | 禁止 | 关闭 | 本站集团通用条款 §15 |
| Noel Leeming | 禁止 | 关闭 | 集团通用条款 §15，适用范围列出该品牌 |
| PB Tech | 禁止 | 关闭 | NZ 条款明确限制自动提取及建立比价数据库 |
| Mighty Ape | 禁止 | 关闭 | §8.5 商用需许可；§10.1.7 复制/商业化需书面许可 |
| JB Hi-Fi NZ | 禁止 | 关闭 | NZ 主站使用条款 §3(b) 限个人非商业用途，已用普通浏览器补齐 |
| Kmart NZ | 禁止 | 关闭 | Responsible Use 明确限制商品列表采集、商业使用与自动工具 |
| Bunnings NZ | 禁止 | 关闭 | 使用条款 §9 限个人用途 |
| Harvey Norman NZ | 禁止 | 关闭 | 使用条款 §8 限个人非商业用途，商业化需书面许可 |

“禁止”项可通过直接书面许可重新评估；“不明确”项须补齐原文或取得书面许可后重新评估。没有任何一项仅凭 robots 被标为允许。

## 1. Woolworths NZ

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.woolworths.co.nz/robots.txt)，浏览工具读取成功（9 行），本地请求连接被远端关闭。原文：

  ```text
  User-agent: *
  Disallow: /shop/search
  Disallow: /specials-offers/boosts
  ```

  同时限制 checkout、account、lists、saved recipes。该文本没有全站禁令，也没有一般商品详情前缀禁令；商品路径是否适用仍需逐 URL 判定，不能据此调用被禁止的搜索路径。
- **条款**：[官方法律条款目录](https://www.woolworths.co.nz/help/terms-conditions)指向[网购、网站及 App 条款 → General Terms and Conditions §6、§8、§11](https://www.woolworths.co.nz/help/terms-conditions/online-shopping-website-app#general-terms-conditions)。文本工具曾超时，本地请求也超时，但随后用普通浏览器成功读取 NZ 主站正文。§6 短摘录：“may be scraped, copied, altered, modified, reproduced, transmitted or distributed”；上下文是除个人下载外，未经事先书面同意不得进行这些行为。§8 还要求创建到本站的超链接先取得明确书面许可；§11 的访问许可限个人用途。没有用澳大利亚 Woolworths 或 MILKRUN 条款替代。
- **API / feed / 联盟**：公开授权状态均未核实；没有取得可用于商业比价与重发的许可。内部接口或开发者自行发布的非官方客户端不等于对外许可。
- **下一步**：取得覆盖采集、转载、图片及超链接的书面许可；在此之前关闭适配器。

## 2. PAK'nSAVE

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.paknsave.co.nz/robots.txt)，文本工具不可访问、本地 HTTP 403，后用普通浏览器成功读取，原文摘录：

  ```text
  User-agent: *
  Disallow: /shop/search
  Disallow: /shop/Search
  Disallow: /*?store=
  ```

  另限制 `/search`、`/Search`、sitecore、utm/source 等参数。一般商品详情路径未见总禁令，但带门店参数的路径和搜索另受限制。此为本站实际读取结果，没有借用 New World 的 robots。
- **条款**：[网站条款 §5](https://www.paknsave.co.nz/terms-and-conditions)可经浏览工具读取，本地 HTTP 403。短摘录：“unless you have express permission from us”。上下文涵盖在线服务中的消息、文件、数据、软件、图片等，不许侵犯相关知识产权，包括复制、修改、重发。另见[网购条款 §10、§11.2](https://www.paknsave.co.nz/shop/terms-and-conditions)：明确涉及 Foodstuffs Supermarkets 服务的复制、镜像、重新发布与分发；未见给予商业比价转载的一般许可。本结论针对拟议复制/转载商品卡片用途，不把知识产权条款扩写成“所有事实均不可比较”。
- **API / feed / 联盟**：本轮在以上官方政策中未取得向第三方开放的产品价格 API、feed 或联盟数据许可，均未核实。Club+ 是消费会员项目，不能当成发布商联盟授权。
- **下一步**：向 Foodstuffs 获取覆盖所需门店、地域、字段及显示方式的书面许可。

## 3. New World

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.newworld.co.nz/robots.txt)浏览工具读取成功（23 行），本地 HTTP 403。原文：

  ```text
  User-agent: *
  Disallow: /shop/search
  Disallow: /shop/Search
  Disallow: /*?store=
  ```

  另限制 `/shop/offer`、搜索、账户、product-promotions 等；没有一般商品详情全前缀禁令，但带门店参数、促销/搜索类路径另受限制。
- **条款**：[网站条款 §5](https://www.newworld.co.nz/terms-and-conditions)，短摘录：“unless you have express permission from us”。在线服务的文件、数据、图片等受知识产权约束；条款列举复制、修改、重发。[网购条款 §10、§11.2](https://www.newworld.co.nz/shop/terms-and-conditions)进一步限制复制、镜像、重新发布或分发服务内容。条款由浏览工具核对，本地 HTTP 403。
- **API / feed / 联盟**：未取得面向第三方商业比价的官方 API / feed / 联盟许可，均未核实。条款覆盖网购服务，不代表授权批量导出其目录。
- **下一步**：同 PAK'nSAVE，取得明确的数据与转载许可；不可用 robots 的未禁止部分替代许可。

## 4–6. The Warehouse / Warehouse Stationery / Noel Leeming

三家分别核对 robots。条款使用能直接读取的[Warehouse Stationery 官方条款](https://www.warehousestationery.co.nz/c/terms-and-conditions)，**其通用条款开头明确列出 The Warehouse、Warehouse Stationery、Noel Leeming，并说明通用条款适用于集团各实体的网站及平台**。因此这不是把一个不相干网站的条款套给另外两家。The Warehouse 自身[条款入口](https://help.thewarehouse.co.nz/Help/s/article/Terms-and-conditions)本轮只返回 Loading / CSS Error，不作为独立正文证据；没有取得 Noel Leeming 单站的特定条款正文，后续仍应复查是否有优先适用的特定条款。

集团通用条款 §15 要求复制、修改、再现网站内容/图片等先取得书面同意；没有核到商业商品目录转载例外。本轮没有发现明确的独立“scraping”条款，**不将此说成明确写有“全面禁止爬虫”**。以下结论针对拟议商业转载内容用途。

### 4. The Warehouse

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.thewarehouse.co.nz/robots.txt)，浏览工具与本地 HTTP 200 均可读。原文：

  ```text
  User-agent: *
  Disallow: /on/demandware.store/
  Disallow: /search?q=*
  Disallow: *pmax*
  Disallow: *pmin*
  ```

  一般 `/p/` 商品路径未见总禁令；搜索、价格筛选参数、账户/结账等受限，另有多种具名爬虫全站禁令。不能以通用组覆盖具名组。
- **条款**：[集团通用条款 §15](https://www.warehousestationery.co.nz/c/terms-and-conditions)，短摘录：“You must not copy, alter or reproduce”。限制对象与书面同意条件见上文。
- **API / feed / 联盟**：本轮未取得可供 WorthIt 使用的产品价格 API / feed / 联盟许可，均未核实；供应商或消费会员渠道不等于发布商数据许可。

### 5. Warehouse Stationery

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.warehousestationery.co.nz/robots.txt)，浏览工具不可访问，但本地 **HTTP 200 text/plain** 成功；原文及请求记录保存在 `crawl-evidence/stationery-robots.txt` 与 manifest。原文：

  ```text
  User-agent: *
  Disallow: /on/demandware.store/
  Disallow: /search?q=*
  Disallow: *pmax*
  Disallow: *pmin*
  ```

  与 Warehouse 接近，但独立读取；一般 `/p/` 商品路径未见总禁令，价格/搜索参数及具名爬虫仍受限制。
- **条款**：[本站通用条款 §15](https://www.warehousestationery.co.nz/c/terms-and-conditions)，短摘录：“You must not copy, alter or reproduce”。原文可通过浏览工具和本地 HTTP 200 读取。
- **API / feed / 联盟**：产品价格 API / feed / 发布商联盟许可均未核实。商业购物或 BizRewards 等采购身份不能推出对外转发数据权。

### 6. Noel Leeming

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.noelleeming.co.nz/robots.txt)，浏览工具与本地 HTTP 200 均可读。原文：

  ```text
  User-agent: *
  Disallow: /on/demandware.store/
  Disallow: /products/variation
  Disallow: /search?q=*
  Disallow: *pmax*
  ```

  另限制 `/products/stores`、`*pmin*`、账户/结账、筛选参数及具名爬虫。一般 `/p/` 详情路径未见总禁令。
- **条款**：[明确列出 Noel Leeming 的集团通用条款 §15](https://www.warehousestationery.co.nz/c/terms-and-conditions)，短摘录：“You must not copy, alter or reproduce”。单站特定条款仍需复查。
- **API / feed / 联盟**：可供第三方商业比价发布的官方 API / feed / 联盟许可均未核实。商业采购渠道不等于此用途授权。

## 7. PB Tech

**结论：禁止。**

- **robots**：[NZ 官方 robots.txt](https://www.pbtech.co.nz/robots.txt)，浏览工具及本地 HTTP 200 可读。原文：

  ```text
  User-agent: *
  Disallow: /search*
  Allow: /
  User-agent: GPTBot
  Disallow: /
  ```

  通用组对 `/product/` 未见总禁令；ClaudeBot、anthropic-ai、CCBot 等也有专门全站禁令。`search=yes` / `ai-input=yes` 等 Content-Signal 不能推翻适用代理组或商业条款，`ai-train=no` 也不是单独的商品采集授权。
- **条款**：[**NZ 域名**条款的 Use of Website Content and Data](https://www.pbtech.co.nz/help/article/87/terms-and-conditions)，浏览工具读取成功，本地 HTTP 403。短摘录：“use any automated tool to access, copy, extract or monitor Website Data”。正文明确涵盖商品列表、价格、描述、图片、规格、库存；未经事先书面许可，不许自动获取或监控、向第三方供应资料、建立或维护比价服务/目录/数据库、用于模型训练或规避访问措施。批发/经销客户已有合同另有优先规则，**不代表 WorthIt 已有该合同**。
- **API / feed / 联盟**：未核实面向普通发布商开放的产品价格 API / feed / 联盟许可。条款承认批发/经销协议可能另行约定；应走书面合作渠道，不能逆向网站内部接口。
- **下一步**：优先询问可授权的字段、图片权、更新频率、缓存和比价展示范围。

## 8. Mighty Ape

**结论：禁止。**

- **robots**：[官方 robots.txt](https://www.mightyape.co.nz/robots.txt)，浏览工具及本地 HTTP 200 可读。原文：

  ```text
  User-Agent: *
  Disallow: /api
  Disallow: /mn/buy/lookup
  Disallow: /mn/*?*price=*
  Allow: /
  ```

  普通 `/mn/buy/…` 详情不被通用组整体禁止，但 lookup、内部 API、搜索/筛选等有禁令；OAI-SearchBot 等具名组有另外的规则。未请求这些接口。
- **条款**：[官方条款 §8.5、§10.1.2、§10.1.7、§15](https://help.mightyape.co.nz/hc/en-nz/articles/115012110928-Terms-Conditions)，浏览工具可读，页面标示更新于 2024-10-23；本地 HTTP 403。短摘录：“You must not use any part of the content on our Website for commercial purposes”。该句后文要求取得许可；另限制脱离官方界面/API 的自动访问及未经书面许可复制/商业化。§15 的链接许可也只涵盖首页并附条件；**不能因为结账跳转回商家就假设商品深链已获许可**。
- **API / feed / 联盟**：条款提到官方 APIs，但没有由此取得产品目录的公开许可、文档或凭证；robots 还明确限制 `/api`。API / feed / 现行联盟计划均未核实，不引用第三方联盟目录的费率作为事实，也不把历史项目当成当前开放项目。
- **下一步**：同时确认商品深链、内容转载和 feed 授权，不能只询问佣金。

## 9. JB Hi-Fi NZ

**结论：禁止。**

- **robots**：[NZ 官方 robots.txt](https://www.jbhifi.co.nz/robots.txt)，浏览工具及本地 HTTP 200 可读。原文：

  ```text
  User-agent: *
  Disallow: /search
  Disallow: /products/gift-card-*
  Disallow: /products/extra-care-*
  ```

  一般 `/products/` 不是全部禁用；还有远程商品后缀模式、推荐接口、多筛选参数等禁令，并有特定数字礼卡例外。不能把某条 Allow 当成整个商品目录放行。只检查 robots，未请求 Shopify 商品 JSON 或推荐接口。
- **条款**：[NZ 使用条款 §3(b) Copyright](https://www.jbhifi.co.nz/pages/help-and-support/terms-of-use)已用普通浏览器成功读取，页面标示 Last updated: Feb 2023。文本工具此前只返回浏览器不支持，不能代表页面无正文。短摘录：“for personal, non-commercial use”。该段在个人浏览/复制打印之外限制下载、复制、存储、分发、展示、发布和衍生等用途，并保留 Copyright Act 1994 等法定例外；没有把它扩写成明确的全面反爬条款。§12 适用新西兰法，§13 明确为 JB Hi-Fi Group (NZ) Ltd，未用 AU/教育/企业礼卡站政策代替。
- **API / feed / 联盟**：普通浏览器在此政策页报告了面向购物的 WebMCP 工具，包括产品搜索/详情接口；**仅观察到接口说明，没有调用或取得商品数据**。这说明存在面向购物代理的接口能力，但不证明授予批量缓存或商业重发权。对 WorthIt 商业比价的 API / feed / 发布商联盟许可仍均未核实；不能把 Shopify、WebMCP 或 AU 合作项目作为 NZ 数据转载授权。
- **下一步**：取得 NZ 主站商用数据许可及其与使用条款的关系，再审。

## 10. Kmart NZ

**结论：禁止。**

- **robots**：[NZ 官方 robots.txt](https://www.kmart.co.nz/robots.txt)，浏览工具可读（30 行），本地 HTTP 403。原文：

  ```text
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /product-discovery*?*
  ```

  普通 `/product/` 详情未见整体禁令，内部 API、带参数 product-discovery、账户、结账等有限制；不能把 Allow 解释为商用许可。
- **条款**：[NZ 官方 Terms of Website Use → Responsible Use](https://www.kmart.co.nz/terms-and-conditions/)，浏览工具可读，本地 HTTP 403。短摘录：“use of any data mining, bots, spiders, automated tools”。本节明确限个人用途，限制商业使用、收集/使用商品列表或描述，以及自动资料获取/提取方法。
- **API / feed / 联盟**：未取得 NZ 商业比价用 API / feed / 发布商联盟许可，均未核实。robots 中出现 `/api/` 是限制路径，不能当成公开 API 文档。
- **下一步**：未经明确例外许可不开发采集器。

## 11. Bunnings NZ

**结论：禁止。**

- **robots**：[NZ 官方 robots.txt](https://www.bunnings.co.nz/robots.txt)，浏览工具及本地 HTTP 200 可读。原文：

  ```text
  User-agent: *
  Disallow: /search
  Disallow: /api/
  Disallow: /apis/
  Disallow: /indoor-living*
  ```

  部分厨房品类路径、账户/购物车、查询参数、媒体路径也受限。一般其他商品详情未见整体禁令；Googlebot 的特定规则不适用于自己的爬虫。
- **条款**：[NZ 使用条款 §9](https://www.bunnings.co.nz/terms-conditions/website-terms-of-use)，浏览工具及本地 HTTP 200 可读。短摘录：“for your own personal use”。上下文将网站使用，以及展示、复制、分发、下载、打印网站部分内容限于个人用途。§8 对加载完整 HTML 页的链接许可不能扩展成商业数据重发或图片授权。
- **API / feed / 联盟**：未取得可供 WorthIt 商用的 NZ 产品价格 API / feed / 发布商联盟许可，均未核实。Trade/采购服务不等于授权向消费者重新发布数据。
- **下一步**：书面商用数据许可与图片/链接许可应分别确认。

## 12. Harvey Norman NZ

**结论：禁止。**

- **robots**：[NZ 官方 robots.txt](https://www.harveynorman.co.nz/robots.txt)，浏览工具不可访问，但本地 **HTTP 200 text/plain** 可读；原文见 `crawl-evidence/harveynorman-robots.txt`。原文：

  ```text
  User-agent: *
  Disallow:*dispatch=*
  Disallow:*category_id=*
  Disallow:*sort_by=*
  ```

  另限制 store_closed、sli_af、subcats、features_hash；没有普通静态商品详情的全站禁令。参数型详情是否匹配禁令须按实际 URL 另查，不能笼统称所有商品都可爬。
- **条款**：[NZ Terms of Use §8 Intellectual Property](https://www.harveynorman.co.nz/corporate-information/terms-of-use.html)，浏览工具及本地 HTTP 200 可读。短摘录：“for personal and non-commercial use only”。上下文限制在另一网站展示、复制、存储、发布、衍生或商业化网站资料，事先须取得书面许可，第三方材料另需权利人许可。
- **API / feed / 联盟**：产品价格 API / feed / 发布商联盟许可均未核实。未把供应商销售合作与导购发布商数据许可混为一谈。
- **下一步**：取得 NZ 业务方书面许可；不同门店/区域资料的适用范围也需确认。

## 证据缺口与实施规则

1. 原先的三个访问缺口已通过普通浏览器补齐：Woolworths NZ 通用条款 §6/§8/§11、JB Hi-Fi NZ 使用条款 §3(b)、PAK'nSAVE robots。保留早先失败记录和补查记录，避免将工具访问能力误当成网站许可。12 家均有 robots 及适用条款的短摘录；其中两家使用明确涵盖该品牌的集团通用条款。
2. The Warehouse、Noel Leeming 的限制来自明确包含这两品牌的集团通用条款；各自特定条款仍需确认，不声称独立打开了各自完整正文。
3. 所有 API / feed / 联盟项目均为**未核实可用授权**。有限范围政策检查不能证明项目不存在；授权谈判或登录后的联盟合同审查另立任务。
4. 当前工程 allowlist 为空，12 家采集开关均关闭。后续只有在授权文件明确覆盖主体、域名、门店、字段、图片、缓存/刷新频率、商业展示、深链、归因及终止处理后才能改变状态；同时按当日 robots 和特定协议约束执行。
5. 本轮没有添加爬虫代码、调用商品接口或测试任何实际商品采集；文档里的 URL 路径说明来自 robots 和政策文本。

## 复核办法

- 独立打开各家官方 robots 与条款，确认所引短句和上下文，特别确认 PB Tech 是 `.co.nz`，Kmart/Bunnings/Harvey Norman 是 NZ 站。
- 对只有本地可读的 Stationery / Harvey Norman robots，可重做普通 GET，并对照 manifest 的状态、来源 URL 和本地文本。若复核时失败，记录复核失败，不能将缓存假称为实时结果。
- 对 Woolworths / JB 的正文和 PAK'nSAVE robots，需用普通浏览器读取可见正文；仅重跑本地脚本会再次得到早先的超时/错误壳，不足以推翻浏览器实读结果。
- 本地证据采集脚本 [collect-policy-evidence.py](collect-policy-evidence.py)固定请求列表，只请求 robots / 条款，不遍历站点；执行 `python docs/collect-policy-evidence.py` 会更新当次日志，当前日志不应在复核前覆盖。
