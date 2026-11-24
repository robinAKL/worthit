# 普通浏览器补查记录

日期：2026-11-24（Pacific/Auckland）。使用后台浏览器打开以下三个精确的政策 URL，读取可见页面与 DOM，没有登录、修改 User-Agent 或绕过访问限制，没有读取产品页或调用产品工具。

## Woolworths NZ

来源：https://www.woolworths.co.nz/help/terms-conditions/online-shopping-website-app

页面标题：Online Shopping, Website and App Terms and Conditions | Woolworths NZ。

General Terms and Conditions §6（Use of the Site）短摘录：

> may be scraped, copied, altered, modified, reproduced, transmitted or distributed

原文上下文：除个人下载外，其他上述行为须事先书面同意。§8 要求超链接事先取得明确书面许可；§11 许可限个人用途。此页对 NZ 网站及 App 适用，非澳洲政策。

## JB Hi-Fi NZ

来源：https://www.jbhifi.co.nz/pages/help-and-support/terms-of-use

页面标题：Terms of use - Help & Support - JB Hi-Fi。Last updated: Feb 2023。

§3(b) 短摘录：

> for personal, non-commercial use

上下文：允许个人浏览/复制打印，其余下载、存储、展示、发布等用途受到限制，并保留 Copyright Act 1994 等法定例外。§12 为新西兰法；§13 主体为 JB Hi-Fi Group (NZ) Ltd (CN 707232)。

浏览器通知另报告面向购物的 WebMCP 工具说明。未调用搜索、产品、购物车或结账工具，未获取任何产品数据；其说明不能证明商业转载许可。

## PAK'nSAVE robots

来源：https://www.paknsave.co.nz/robots.txt

浏览器显示纯文本，相关原文摘录：

```text
User-agent: *
Disallow: /shop/search
Disallow: /shop/Search
Disallow: /*?store=
```

另见 search/Search、sitecore、utm/source 等禁令及两个 sitemap 声明。未抓取 sitemap 或商品数据。
