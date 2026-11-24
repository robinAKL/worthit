# 第二批补查记录（2026-11-24，Pacific/Auckland）

范围仅robots与政策页。没有访问商品详情、商品列表、搜索接口、购物车或结账；政策附带导航不算商品资料。没有登录、提交表单、修改UA、解验证码或绕过限制。

## 普通浏览器已读正文

- Briscoes、Rebel Sport NZ：各自 `/terms-and-conditions/` 的完整可见条款，特别是 Right to Use Site and Content。复制/分发及链接需事先书面同意。初次HTTP200只是JS提示，manifest保留该事实。
- Baby Factory：`https://www.babyfactory.co.nz/terms` 完整可见正文，从General、Acceptance、价格、运费、交付、风险、退货、责任、法律，到Changes、Q Card、Microsoft Clarity、Use of AI。核心是供货条件，未见针对网站自动采集、复制或商用的禁令；没有把商品风险所有权段误认为网站IP。引文只在主报告保留一次。页脚另有 `/privacy-policy`；浏览工具读取该页未得到政策主体，故不能宣称已经完整审计所有潜在政策。初筛候选的范围与此证据边界必须一起保留。
- Mocka NZ：NZ页脚Terms进入 `https://www.mocka.co.nz/pages/helpdesk?hcUrl=%2Fen-US%2Farticles%2Fterms-274290`。嵌入帮助中心列出Copyright；直接读取其可见链接 `https://mocka-nz-copy-copy.gorgias.help/en-US/copyright-1432691?isEmbedded=true`。该页明文要求网站材料任何使用事先书面许可，图片亦需许可。没有替换成澳洲帮助中心。
- Nature Baby NZ：页脚Terms of Use指向 `/policies/terms-of-service`，页面标题虽为Terms of service，主体实际是Australian Payments、Privacy and Cookie Policy、信息收集、安全、cookies、外站链接、个人信息。范围不足，结论不明确。旧 `/pages/terms-of-use` 404、`/pages/terms-conditions` 是促销，另读 `/policies/legal-notice` 是错误/价格说明。没有推断没有条款。

## 浏览工具补充

- Farmers：本地robots/条款HTTP200是挑战壳；浏览工具从NZ域名读到robots 21行和条款§1 Intellectual Property。robots原文的一般组是 `User-agent:*`（无空格），主报告为阅读排版加入空格，不改变匹配含义。条款明文限制系统提取、数据挖掘及价格/列表数据库；没有把本地失败当成网站无禁令。
- Rubber Monkey：初次 `/TermsAndConditions` 为403；官方政策导航实际指向 `/Home/Terms`，浏览工具完整读取§2 General Conditions。未用猜测地址的失败否认实际政策。
- Further Faster：先读旧 `/pages/terms-of-service-and-privacy`，再读官网政策导航所指 `/pages/terms-and-conditions-and-privicy-policy`；两者§2的书面许可限制一致。
- Ascent：本地及浏览工具均可读完整 `/conditions.aspx`，逐节是供货条件。末尾Other legal stuff只有法律、waiver、合同转让；页脚all rights reserved。没有发现所筛三类禁令，未宣称取得网站内容许可。
- Macpac：本地及浏览工具完整读取 `/terms.html`。Intellectual Property Rights限制使用网站信息；即使没写scraping字样也排除。该段原文短摘录只见主报告，未重复保留全文。

## 复核与局限

manifest记录的是第一轮40个固定政策请求，有状态、时间、哈希和本地解析长度；不记录后来浏览器的网络状态，不能把它当作浏览器取证文件。除robots快照外，不发布完整网页正文。后续补查的实际URL及渠道在本记录和主报告，不用修改旧失败日志来伪造首次成功。

“允许”只按Robin本轮指示筛选已读条款未明文禁止的价格/规格事实候选；不表示已获权利人许可、已穷尽全部可能协议，或已测实际商品URL。下一期实现前须重新检查当日robots/政策及实际路径。主报告保留上线前律师复核说明。
