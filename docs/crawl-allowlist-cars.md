# 新西兰二手车网站清单与采集政策初筛

日期：2026-11-24（Pacific/Auckland）。负责人Codex，独立复核人Claude。**上线前需请新西兰律师复核。**

本轮列出 **43个站点/服务：可采集1家、禁止15家、不确定27家**。当前事实字段候选只有 **Budget Car Sales（budgetcarsales.co.nz）**。这是按Robin“未发现可用公开API，且已读规则无明文禁令”的初筛，不是商家授权或法律裁判。其封面图及原始描述使用许可未核实。

## 范围与判定

- 广泛检索全国平台、经销商集团、地区车行及拍卖/进口商，覆盖Auckland、Waikato、Wellington、Hawke's Bay、Christchurch、Dunedin等。不是可证明穷尽全市场的名录；按站点合并分店，别名和域名迁移不重复计数。CarJam是用户点名的车辆数据服务，单独标明，不把它当普通在售车源。Facebook是全球平台，单独标明NZ使用场景。
- **可采集**：公开政策初筛未见事实采集禁令且robots没有对应禁区；**禁止**：条款或一般robots明确限制拟议的批量提取/复制；**不确定**：条款、robots、网址或适用范围未核清。拿不到条款、仅有隐私/促销、200错误壳都不能推断“没有禁令”。
- API/feed/联盟的“未核实”表示没有取得适用于WorthIt的公开入口和许可，**不是证明不存在API**。卖家上架、网站内部API、WordPress RSS、第三方爬取服务、用户查询接口均不自动等于整库再发布权。
- 本任务只核查政策，不启动车辆采集。后续事实范围仅价格、年份、公里数、车型、地区及来源链接/核查时间；不采卖家个人信息。首页或政策自带的库存片段不提取为车辆数据集，不请求车辆详情或sitemap正文。
- 依Robin后续要求，封面图与详情摘要单独判断：图片热链也是展示，不能以“不下载”推定许可；不直接搬原描述。候选可基于核实事实生成自己的摘要和排序理由，图片须另核权利。此报告没有授予任何图片权利。
- 每个站最多打开5个不同页面/资源；脚本还将HTTP尝试（含跳转）限制在5次内。外部搜索结果只用于定位，不把摘要视为完整条款；确实使用索引正文之处注明。登录/403/404/连接失败保留，不绕过。没有发信、注册、登录或调用车辆API。
- 【已核实】表示本轮读到对应文字/状态，不表示获许可；【未核实】明确证据缺口。引文每条不超过15词，完整条款不入库。[请求与补查记录](crawl-evidence-cars/manifest.json)及robots快照可供复核。

## 三类站点汇总

| 网站/服务 | 类型 | 结论 | 官方入口 |
|---|---|---|---|
| Apex Hub | 聚合平台 | 禁止 | [网站](https://www.apexhub.co.nz/) |
| Autostock | 聚合平台 | 禁止 | [网站](https://www.autostock.co.nz/) |
| AutoTrader NZ | 聚合平台 | 禁止 | [网站](https://autotrader.co.nz/) |
| Cari Cars | 聚合平台 | 不确定 | [网站](https://cars.cari.co.nz/) |
| CarJam（车辆历史/数据，不是车源市场） | 聚合平台 | 禁止 | [网站](https://www.carjam.co.nz/) |
| DRIVEN Car Guide | 聚合平台 | 禁止 | [网站](https://www.drivencarguide.co.nz/) |
| Facebook Marketplace NZ | 聚合平台 | 禁止 | [网站](https://www.facebook.com/) |
| Need A Car | 聚合平台 | 不确定 | [网站](https://www.needacar.co.nz/) |
| Trade Me Motors | 聚合平台 | 禁止 | [网站](https://www.trademe.co.nz/) |
| 2 Cheap Cars | 经销商集团 | 不确定 | [网站](https://www.2cheapcars.co.nz/) |
| AJ Motors | 经销商集团 | 不确定 | [网站](https://www.ajmotors.co.nz/) |
| Andrew Simms | 经销商集团 | 不确定 | [网站](https://www.andrewsimms.co.nz/) |
| Armstrong's | 经销商集团 | 不确定 | [网站](https://www.armstrongs.co.nz/) |
| Bayswater Vehicles | 经销商集团 | 不确定 | [网站](https://www.bayswatervehicles.co.nz/) |
| Blackwells | 经销商集团 | 不确定 | [网站](https://www.blackwells.co.nz/) |
| Bowater Motor Group | 经销商集团 | 禁止 | [网站](https://www.bowaters.co.nz/) |
| Brendan Foot Supersite | 经销商集团 | 不确定 | [网站](https://www.brendanfoot.co.nz/) |
| Continental Cars | 经销商集团 | 禁止 | [网站](https://www.continentalcars.co.nz/) |
| Cooke Howlison | 经销商集团 | 不确定 | [网站](https://www.cookehowlison.co.nz/) |
| Ebbett | 经销商集团 | 禁止 | [网站](https://www.ebbett.co.nz/) |
| Enterprise Motor Group | 经销商集团 | 不确定 | [网站](https://www.enterprisecars.co.nz/) |
| Gazley | 经销商集团 | 不确定 | [网站](https://www.gazley.com/) |
| Giltrap Group | 经销商集团 | 禁止 | [网站](https://www.giltrap.com/) |
| Ingham | 经销商集团 | 禁止 | [网站](https://www.inghamdriven.nz/) |
| Miles Group | 经销商集团 | 不确定 | [网站](https://www.milesgroup.co.nz/) |
| Rutherford and Bond Toyota | 经销商集团 | 禁止 | [网站](https://www.rutherfordandbond.co.nz/) |
| 4 Guys Autobarn | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.4guys.co.nz/) |
| Auto Court Dunedin | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.autocourt.net.nz/) |
| Auto Luxe / Premium Wholesale Cars | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.premiumwholesalecars.co.nz/) |
| Autoport NZ | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.autoport.nz/) |
| Brian Scott Motors | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.brianscottmotors.co.nz/) |
| Budget Car Sales | 拍卖与进口商及独立车行 | 可采集 | [网站](https://www.budgetcarsales.co.nz/) |
| Croydon Wholesalers | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.croydons.co.nz/) |
| Dave Allen Motors | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.daveallenmotors.co.nz/) |
| Genuine Vehicle Imports | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.gvi.kiwi/) |
| Manheim NZ | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.manheim.co.nz/) |
| MotorCo | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.motorco.co.nz/) |
| NZ Cheap Cars | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.nzcheapcars.co.nz/) |
| NZC Cars | 拍卖与进口商及独立车行 | 不确定 | [网站](https://nzc.kiwi/) |
| Portage Cars | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.portagecars.co.nz/) |
| Tauranga Cars | 拍卖与进口商及独立车行 | 不确定 | [网站](https://www.taurangacars.co.nz/) |
| Turners | 拍卖与进口商及独立车行 | 禁止 | [网站](https://www.turners.co.nz/) |
| Wheeler Motor Company | 拍卖与进口商及独立车行 | 禁止 | [网站](https://wheelermotors.co.nz/) |

## 逐站核查

### 1. Apex Hub

**结论：禁止。** 类型：聚合平台；[站点](https://www.apexhub.co.nz/)。

- **robots【已核实】**：[官方](https://www.apexhub.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /dashboard
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/apexhub-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.apexhub.co.nz/terms-of-use)，短摘录：“raw full-stock exports”。针对批量整库采集禁止/不适用：公开服务仅有限消费者匹配和事实比较，原始全库导出排除；另有有限MCP查询，不能把消费者查询权限扩张成抓全库或获得第三方图片权利。
- **API/feed/联盟**：有限MCP/免费库存查询与付费服务分界【已核实】，见[官方AI接入说明](https://www.apexhub.co.nz/ollie/for-ai)。原始搜索/列表/全库导出需管理员会话；不申请或借用凭证。整库feed及导购联盟许可【未核实】。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 2. Autostock

**结论：禁止。** 类型：聚合平台；[站点](https://www.autostock.co.nz/)。

- **robots【已核实】**：[官方](https://www.autostock.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/autostock-robots.txt)。

  sitemap访问规则：【已核实】一般组全站禁令也覆盖sitemap；不移用指定爬虫例外。
- **条款【已核实】**：[适用政策](https://www.autostock.co.nz/terms)，短摘录：“personal, non-commercial use”。一般robots组全站Disallow:/；已核实官方索引政策限制复制及商用。直接GET条款是JS壳，不声称本地读到完整正文；指定Google/AI代理例外不适用于WorthItBot。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 3. AutoTrader NZ

**结论：禁止。** 类型：聚合平台；[站点](https://autotrader.co.nz/)。

- **robots【已核实】**：[官方](https://autotrader.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow:
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/autotrader-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://autotrader.co.nz/terms-and-conditions)，短摘录：“you must not modify, copy, reproduce, republish”。Intellectual property段限制复制、重发、向第三方上传等；个人非商业下载例外不适用WorthIt。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 4. Cari Cars

**结论：不确定。** 类型：聚合平台；[站点](https://cars.cari.co.nz/)。

- **robots【已核实】**：[官方](https://cars.cari.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  Disallow: /index.php?*
  Disallow: /ajax/*
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/cari-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【未核实】**：robots限制/motor/view/*、/mobil/view/*及若干资源/查询路径；未确认全部当前详情路径，首页未找到适用条款。 已检查：[已查页面1](https://www.cari.co.nz/privacy-policy)、[已查页面2](https://www.cari.co.nz/xml-feed)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 5. CarJam（车辆历史/数据，不是车源市场）

**结论：禁止。** 类型：聚合平台；[站点](https://www.carjam.co.nz/)。

- **robots【已核实】**：[官方](https://www.carjam.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-Agent: *
  Allow: /
  Disallow: /pedia/
  Disallow: /wiki/
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/carjam-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.carjam.co.nz/cms:page?t=terms-and-conditions)，短摘录：“store, retain, cache, persist, archive, log or index”。针对持久化车辆库禁止：AI/Automated System只可为当次用户请求临时取得并随即丢弃，不可长期留存或建库。不是说所有CarJam自动查询都禁止；另有付费API条款。本项是车辆历史/数据服务，不作为普通在售车源数量充数。
- **API/feed/联盟**：API存在【已核实】，[官方API条款](https://www.carjam.co.nz/cms%3Apage?s=wof&t=api-terms-and-conditions)要求按约定使用，第三方披露和保留受限。事实数据库再发布及发布商feed/联盟许可【未核实】；没有调用API。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 6. DRIVEN Car Guide

**结论：禁止。** 类型：聚合平台；[站点](https://www.drivencarguide.co.nz/)。

- **robots【已核实】**：[官方](https://www.drivencarguide.co.nz/robots.txt)，本地200文本；未读到标准User-agent:*一般组（可能只有指定组或非标准文本），不据此证明普通采集器获得放行；以下只是原文片段。

  ```text
  Sitemap: https://www.drivencarguide.co.nz/sitemap.xml
  User-agent: BingBot
  Disallow: /search/
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/driven-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【已核实】**：[适用政策](https://www.drivencarguide.co.nz/terms-conditions)，短摘录：“no content may be reproduced, published or transmitted”。NZME Network条款限个人使用，复制/发布须事先书面同意。DRIVEN/旧driven域名不重复计数；这是汽车媒体及相关车源入口，不等于独立车商库存。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 7. Facebook Marketplace NZ

**结论：禁止。** 类型：聚合平台；[站点](https://www.facebook.com/)。

- **robots【已核实】**：[官方](https://www.facebook.com/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/facebook-robots.txt)。

  sitemap访问规则：【已核实】一般组全站禁令也覆盖sitemap；不移用指定爬虫例外。
- **条款【未核实】**：[自动采集条款入口](https://www.facebook.com/legal/automated_data_collection_terms)跳登录/临时阻挡；没有登录。一般robots明确全站Disallow:/，足以排除本次自建采集器。自动采集条款入口跳登录并显示临时阻挡，正文未核实；未登录或继续尝试。NZ Marketplace属于全球平台，不是本土经销商。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 8. Need A Car

**结论：不确定。** 类型：聚合平台；[站点](https://www.needacar.co.nz/)。

- **robots【已核实】**：[官方](https://www.needacar.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/needacar-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：首页403；robots可读但未取得网站条款。未把Motorcentral提供的软件/第三方上架接口当作本站数据出口。 已检查：[已查页面1](https://www.needacar.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 9. Trade Me Motors

**结论：禁止。** 类型：聚合平台；[站点](https://www.trademe.co.nz/)。

- **robots【已核实】**：[官方](https://www.trademe.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  Disallow: /a/*(modal:login)
  Disallow: /a/*(modal:login)$
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/trademe-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://developer.trademe.co.nz/terms-and-conditions)，短摘录：“must not reuse or resupply any Data”。沿用已核实Trade Me规则：商业重用、数据组合/保留及衍生信息受限，Motors API面向获批车商/系统集成商，不是消费导购整库接口。未重复深挖。
- **API/feed/联盟**：Motors API存在及获批用途限制【已核实】，见[官方开发页](https://developer.trademe.co.nz/)及[条款](https://developer.trademe.co.nz/terms-and-conditions)。WorthIt获批、车辆目录feed和导购联盟许可【未核实】，不假设有佣金。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 10. 2 Cheap Cars

**结论：不确定。** 类型：经销商集团；[站点](https://www.2cheapcars.co.nz/)。

- **robots【已核实】**：[官方](https://www.2cheapcars.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /admin/
  Disallow: /account/
  Disallow: /home/search
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/2cheap-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：只读到隐私政策；检索发现Buy Now交易PDF，但网站自动提取/转载条款未核清。 已检查：[已查页面1](https://www.2cheapcars.co.nz/other/privacy-policy)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 11. AJ Motors

**结论：不确定。** 类型：经销商集团；[站点](https://www.ajmotors.co.nz/)。

- **robots【已核实】**：[官方](https://www.ajmotors.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow:
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/ajmotors-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：/terms实际是2025-12至2026-01的MBI促销条件，不能当作网站使用条款；另读到隐私政策。 已检查：[已查页面1](https://www.ajmotors.co.nz/privacy-policy)、[已查页面2](https://www.ajmotors.co.nz/terms)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 12. Andrew Simms

**结论：不确定。** 类型：经销商集团；[站点](https://www.andrewsimms.co.nz/)。

- **robots【已核实】**：[官方](https://www.andrewsimms.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /administrator/
  Disallow: /bin/
  Disallow: /cache/
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/andrewsimms-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：只读到Privacy Policy，未核实网站复制/自动化条款。 已检查：[已查页面1](https://www.andrewsimms.co.nz/privacy-policy)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 13. Armstrong's

**结论：不确定。** 类型：经销商集团；[站点](https://www.armstrongs.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.armstrongs.co.nz/robots.txt)。读取结果：('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：robots与首页连接被远端关闭；检索仅找到促销条件，不能代替网站使用条款。 已检查：[已查页面1](https://www.armstrongs.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 14. Bayswater Vehicles

**结论：不确定。** 类型：经销商集团；[站点](https://www.bayswatervehicles.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.bayswatervehicles.co.nz/robots.txt)。读取结果：403。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：robots/首页403；官网索引可确认品牌与域名，网站使用条款未读到。 已检查：[已查页面1](https://www.bayswatervehicles.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 15. Blackwells

**结论：不确定。** 类型：经销商集团；[站点](https://www.blackwells.co.nz/)。

- **robots【已核实】**：[官方](https://www.blackwells.co.nz/robots.txt)，本地200文本；未读到标准User-agent:*一般组（可能只有指定组或非标准文本），不据此证明普通采集器获得放行；以下只是原文片段。

  ```text
  Disallow: /i/files
  Disallow: /i/images
  Disallow: /i/pumedia
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/blackwells-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【未核实】**：只读到Privacy Policy，未取得网站内容使用条款。 已检查：[已查页面1](https://www.blackwells.co.nz/privacy-policy/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 16. Bowater Motor Group

**结论：禁止。** 类型：经销商集团；[站点](https://www.bowaters.co.nz/)。

- **robots【已核实】**：[官方](https://www.bowaters.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /administrator/
  Disallow: /api/
  Disallow: /bin/
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/bowater-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【已核实】**：[适用政策](https://www.bowaters.co.nz/terms-and-conditions)，短摘录：“adapt, reproduce, copy, store, distribute”。§5网站知识产权条款要求事先书面许可，商业化亦受限。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 17. Brendan Foot Supersite

**结论：不确定。** 类型：经销商集团；[站点](https://www.brendanfoot.co.nz/)。

- **robots【已核实】**：[官方](https://www.brendanfoot.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /?s=
  Disallow: /page/*/?s=
  Disallow: /search/
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/brendanfoot-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：Information Policy & Site Terms正文实际主要是客户信息/隐私处理；未确认网站转载权限，金融条款不能替代。 已检查：[已查页面1](https://www.brendanfoot.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 18. Continental Cars

**结论：禁止。** 类型：经销商集团；[站点](https://www.continentalcars.co.nz/)。

- **robots【已核实】**：[官方](https://www.continentalcars.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /cms/wp-admin/admin-ajax.php
  Disallow: /cms/wp-admin/
  Disallow: /book-test-list*
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/continental-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.continentalcars.co.nz/legal/website-terms-and-conditions/)，短摘录：“use automated scripts to collect information”。§3.2限制复制和数据库汇编，§4.1(e)禁止自动脚本收集。原Legal目录只是入口，已另读网站条款。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 19. Cooke Howlison

**结论：不确定。** 类型：经销商集团；[站点](https://www.cookehowlison.co.nz/)。

- **robots【已核实】**：[官方](https://www.cookehowlison.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/cookehowlison-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：只找到隐私政策与金融/促销内容，未取得适用网站使用条款。 已检查：[已查页面1](https://www.cookehowlison.co.nz/privacy-policy)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 20. Ebbett

**结论：禁止。** 类型：经销商集团；[站点](https://www.ebbett.co.nz/)。

- **robots【已核实】**：[官方](https://www.ebbett.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /thanks/*
  Disallow: /log-in
  Disallow: /reset-password
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/ebbett-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.ebbett.co.nz/terms-and-conditions)，短摘录：“should not be changed, copied, reproduced, sold, rented, used”。Intellectual Property段要求对网站信息及内容的这些使用取得事先书面许可。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 21. Enterprise Motor Group

**结论：不确定。** 类型：经销商集团；[站点](https://www.enterprisecars.co.nz/)。

- **robots【已核实】**：[官方](https://www.enterprisecars.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/enterprisecars-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【未核实】**：正确车行是enterprisecars.co.nz，robots可读但首页403；enterprise.co.nz招聘公司已排除。 已检查：[已查页面1](https://www.enterprisecars.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 22. Gazley

**结论：不确定。** 类型：经销商集团；[站点](https://www.gazley.com/)。

- **robots【已核实】**：[官方](https://www.gazley.com/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /thank-you
  Disallow: /vehicle-search/detail
  Disallow: /contact/forms/*
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/gazley-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：robots限制/vehicle-search/detail；官网terms-of-use又重定向，但本轮5次读取上限已用完，未继续追踪。不能把某些AI代理Allow:/移用于WorthIt。 已检查：[已查页面1](https://gazley.com/terms-of-use)、[已查页面2](https://gazley.com/privacy-policy)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 23. Giltrap Group

**结论：禁止。** 类型：经销商集团；[站点](https://www.giltrap.com/)。

- **robots【已核实】**：[官方](https://www.giltrap.com/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-Agent: *
  Allow: /
  Disallow: /auth/logout
  Disallow: /auth/verify
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/giltrap-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.giltrap.com/terms-of-use)，短摘录：“use any data gathering and extraction tools or software”。§5 License既限制复制/存储/展示，也明确限制数据提取工具；限个人目的。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 24. Ingham

**结论：禁止。** 类型：经销商集团；[站点](https://www.inghamdriven.nz/)。

- **robots【已核实】**：[官方](https://www.inghamdriven.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/ingham-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://www.inghamdriven.nz/terms-and-conditions/1/549/)，短摘录：“No other use, including reproducing, adapting, distributing, storing, broadcasting or copying”。Intellectual Property段限制超出网站预期目的的使用，需书面许可。/551为隐私政策，决定性网站条款是/549，未混淆。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 25. Miles Group

**结论：不确定。** 类型：经销商集团；[站点](https://www.milesgroup.co.nz/)。

- **robots【已核实】**：[官方](https://www.milesgroup.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /wp-content/uploads/wc-logs/
  Disallow: /wp-content/uploads/woocommerce_transient_files/
  Disallow: /wp-content/uploads/woocommerce_uploads/
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/miles-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：首页指向/terms/与/privacy/，两者403，不能推断没有限制。 已检查：[已查页面1](https://www.milesgroup.co.nz/terms/)、[已查页面2](https://www.milesgroup.co.nz/privacy/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 26. Rutherford and Bond Toyota

**结论：禁止。** 类型：经销商集团；[站点](https://www.rutherfordandbond.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.rutherfordandbond.co.nz/robots.txt)。读取结果：301；200。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【已核实】**：[适用政策](https://www.toyota.co.nz/legal-and-privacy-policy/)，短摘录：“adapt, reproduce, copy, store, distribute”。Rutherford & Bond入口实际转入Toyota NZ站，适用其网站Legal and Privacy Policy §1.4；原域名robots未核清，不以集团名冒充独立robots许可。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 27. 4 Guys Autobarn

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.4guys.co.nz/)。

- **robots【已核实】**：[官方](https://www.4guys.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /config
  Disallow: /search
  Disallow: /account$
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/4guys-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：一般robots组限制search/account/api和JSON等路径；没有找到网站使用条款，不因只看到常规禁区就标允许。 已检查：[已查页面1](https://www.4guys.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 28. Auto Court Dunedin

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.autocourt.net.nz/)。

- **robots【已核实】**：[官方](https://www.autocourt.net.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow:
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/autocourt-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：首页未找到条款；robots空Disallow不等于取得内容再发布许可。 已检查：[已查页面1](https://www.autocourt.net.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 29. Auto Luxe / Premium Wholesale Cars

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.premiumwholesalecars.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.premiumwholesalecars.co.nz/robots.txt)。读取结果：HTTPSConnectionPool(host='www.premiumwholesalecars.co.nz', port=443): Max retries exceeded with url: /robots.txt (Caused by NameResolutionError("HTTPSConnection。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：官方检索把premiumwholesalecars.co.nz标为Auto Luxe；当前robots/首页访问失败，条款未核实，不当作已确认可运行车源。 已检查：[已查页面1](https://www.premiumwholesalecars.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 30. Autoport NZ

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.autoport.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.autoport.nz/robots.txt)。读取结果：404。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：robots、首页及官方/resources/terms-and-conditions均404；搜索可找到官方政策索引，但未读到可用于本次判定的正文。 已检查：[已查页面1](https://www.autoport.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 31. Brian Scott Motors

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.brianscottmotors.co.nz/)。

- **robots【已核实】**：[官方](https://www.brianscottmotors.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /Motorcentral/
  Disallow: /Admin
  Disallow: /Admin.aspx
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/brianscott-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【未核实】**：首页没有找到条款；robots有Motorcentral/Admin/BuyNow等禁区，不能据此推定内容再发布许可。 已检查：[已查页面1](https://www.brianscottmotors.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 32. Budget Car Sales

**结论：可采集。** 类型：拍卖与进口商及独立车行；[站点](https://www.budgetcarsales.co.nz/)。

- **robots【已核实】**：[官方](https://www.budgetcarsales.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /email/*
  Disallow: /feedds/*
  Disallow: /appreciation_email/*
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/budget-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【已核实】**：[适用政策](https://www.budgetcarsales.co.nz/terms-conditions)，短摘录：“These terms and conditions govern the use of our website”。按Robin的无明文禁令初筛：完整§1–6与页内隐私/交易部分已读，未见自动提取、事实转载或网站商用禁令。§4.3禁止复制/反向工程的是售出Goods及相关服务；§4.4确认网站IP归属，但没有另写事实采集禁令，不把所有权声明扩写成明文反爬。robots仅挡邮件/feedds等路径。仅五类事实候选，未获商家书面授权；图片权利未核实。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 33. Croydon Wholesalers

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.croydons.co.nz/)。

- **robots【已核实】**：[官方](https://www.croydons.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /Motorcentral/
  Disallow: /Admin
  Disallow: /Admin.aspx
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/croydons-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【未核实】**：官方车行是croydons.co.nz，首页可读但未找到条款；初猜的长域名失败另记排除项。 已检查：[已查页面1](https://www.croydons.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 34. Dave Allen Motors

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.daveallenmotors.co.nz/)。

- **robots【已核实】**：[官方](https://www.daveallenmotors.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  allow: /
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/daveallen-robots.txt)。

  sitemap访问规则：【已核实】存在明确sitemap路径禁令：`Disallow: /sitemap/`。其他路径须另查。
- **条款【未核实】**：terms-and-conditions页面主体实际是Privacy information；无复制禁令不等于完整网站使用条款已核清。robots另挡/sitemap/，不能默认取该路径。 已检查：[已查页面1](https://www.daveallenmotors.co.nz/terms-and-conditions/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 35. Genuine Vehicle Imports

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.gvi.kiwi/)。

- **robots【已核实】**：[官方](https://www.gvi.kiwi/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow:
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/gvi-cars-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：正确车行是gvi.kiwi；gvi.co.nz是货运公司，不套用其条款。本车行首页未找到网站使用条款。 已检查：[已查页面1](https://www.gvi.kiwi/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 36. Manheim NZ

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.manheim.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.manheim.co.nz/robots.txt)。读取结果：403。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：robots/首页403；找到竞拍注册条款索引，未把其视为完整网站内容许可。 已检查：[已查页面1](https://www.manheim.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 37. MotorCo

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.motorco.co.nz/)。

- **robots【已核实】**：[官方](https://www.motorco.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /wp-admin/
  Allow: /wp-admin/admin-ajax.php
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/motorco-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：规范域名motorco.co.nz可确认，但首页未找到条款；搜索出现/feed/仅是WordPress内容入口线索，未取feed、不认定为授权车源feed。 已检查：[已查页面1](https://www.motorco.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 38. NZ Cheap Cars

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.nzcheapcars.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.nzcheapcars.co.nz/robots.txt)。读取结果：403。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：NZ Cheap Cars与2 Cheap Cars是分别记录的不同站；robots/首页/terms-and-conditions均403。 已检查：[已查页面1](https://www.nzcheapcars.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 39. NZC Cars

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://nzc.kiwi/)。

- **robots【已核实】**：[官方](https://nzc.kiwi/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  Disallow: /admin
  Disallow: /admin/login
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/nzc-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【未核实】**：当前域名nzc.kiwi可确认；robots一般组允许公开路径，首页未找到适用条款。 已检查：[已查页面1](https://nzc.kiwi/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 40. Portage Cars

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.portagecars.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.portagecars.co.nz/robots.txt)。读取结果：403。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：www入口及官网无www条款都403，网站条款未读到。 已检查：[已查页面1](https://www.portagecars.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 41. Tauranga Cars

**结论：不确定。** 类型：拍卖与进口商及独立车行；[站点](https://www.taurangacars.co.nz/)。

- **robots/sitemap【未核实】**：[robots](https://www.taurangacars.co.nz/robots.txt)。读取结果：403。没有可解释的robots正文，不推断许可或sitemap状态。
- **条款【未核实】**：robots/首页403；官方搜索索引能确认网站，但找到的是金融说明而非网站内容条款。 已检查：[已查页面1](https://www.taurangacars.co.nz/)。没有可核实的适用禁令/许可引文，不能编造引文或据无结果判允许。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 42. Turners

**结论：禁止。** 类型：拍卖与进口商及独立车行；[站点](https://www.turners.co.nz/)。

- **robots【已核实】**：[官方](https://www.turners.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Allow: /
  ```

  sitemap声明：【已核实】存在（仅核对声明，未请求正文）；[完整robots](crawl-evidence-cars/turners-robots.txt)。

  sitemap访问规则：【已核实】一般组未见所声明sitemap路径的独立禁令；仅检查规则，没有读取sitemap正文。
- **条款【已核实】**：[适用政策](https://content.tgstatic.co.nz/webassets/globalassets/terms-and-conditions/website-terms-and-conditions-may-2025.pdf)，短摘录：“use automated scripts to collect information”。2025-05网站条款§4.2禁止复制/保留/数据库汇编，§5.1(e)明确禁止自动脚本。已从官方Terms目录定位网站PDF，不以买卖交易条款代替。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

### 43. Wheeler Motor Company

**结论：禁止。** 类型：拍卖与进口商及独立车行；[站点](https://wheelermotors.co.nz/)。

- **robots【已核实】**：[官方](https://wheelermotors.co.nz/robots.txt)，本地200文本；一般组片段如下；指定代理组和其他禁区以完整文本为准。

  ```text
  User-agent: *
  Disallow: /Motorcentral/
  Disallow: /Admin
  Disallow: /Admin/
  ```

  sitemap声明：【未核实】本次文本未列出；不证明不存在；[完整robots](crawl-evidence-cars/wheeler-robots.txt)。

  sitemap访问规则：【未核实】缺少一般组或未声明sitemap，无法确认实际sitemap路径及其规则。
- **条款【已核实】**：[适用政策](https://www.wheelermotors.co.nz/terms-of-use)，短摘录：“Copy, scrape, harvest or systematically extract our listings, images or content”。Website Terms of Use（2026-09-10）明文限制抓取/系统提取，图片、内容也仅个人非商业使用。旧wmc.co.nz停放域名已排除。
- **API/feed/联盟【未核实】**：本轮首页、政策导航与所列已查政策未确认可供WorthIt使用的官方车源API、商品feed或发布商联盟许可；不声称这些渠道不存在。不能把车商向平台同步库存的能力当作本项目可取走库存。
- **封面图/详情摘要【未核实】**：未取得图片展示或原描述再发布许可；本结论只针对上述事实字段，热链不构成许可证明。

## 事实候选与实施边界

**Budget Car Sales：1家。** 这是拟议的事实字段初筛候选，不是已运行采集器或书面授权。robots禁止 `/email/*`、`/feedds/*`、`/appreciation_email/*`，不得进入这些路径。§4.4保留网站IP；没有核实封面图许可，不把事实候选扩大成图片或原描述的转载许可。上线前重新读当日robots与条款，实际详情路径尚未测试；ORC和GST需保留语义，不能把不含上路费的报价和总价直接排名。

其余来源不进入当前事实采集候选。Apex的有限消费者查询、CarJam的当次请求和Trade Me的获批卖家接口可作为另行评估的合作方向，不能用来绕过本表的批量建库限制。

## 排除错误网址和后续发现线索

| 名称/线索 | 本轮处理 |
|---|---|
| gvi.co.nz | 实为GVI Logistics，未套用货运条款；正确车行gvi.kiwi已列 |
| wmc.co.nz | 停放域名；正确wheelermotors.co.nz已列 |
| enterprise.co.nz | 招聘网站；正确enterprisecars.co.nz已列 |
| croydonwholesalers.co.nz | 初猜域名失败；从官方检索定位croydons.co.nz并已列 |
| Capital City Cars | 从经销商目录找到此车行，但capitalcitycars.co.nz当前不可确认；暂不计入43个站点或候选，待取得正确官网 |

发现入口包括[Trade Me车商目录](https://www.trademe.co.nz/a/motors/dealerships)、[Autofile车商目录](https://autofile.co.nz/dealerdirectory)和官方品牌检索。目录只用于定位，第三方库存聚合页、搜索摘要里的车价、CIN文件或私人卖家资料没有纳入车辆数据集。门店和网站会变化，“43个”不等于新西兰总数。

## 复核办法

独立查看候选Budget Car Sales的完整条款§1–6，特别区分Goods反向工程限制与网站IP所有权；确认robots是当前文本。再核查Turners网站PDF、Continental实际网站条款、Wheeler的明确scrape条款，以及Apex“有限查询”与“批量导出”的区别。逐条核对manifest访问状态和5页上限；未核实项不能由审稿人自动改成允许。
