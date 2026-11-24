import type { Copy } from './en';
import type { Lane } from '../lib/types';

const sampleMerchants: Record<string, string> = {
  'Sample Store A': '示例商家甲',
  'Sample Store B': '示例商家乙',
  'Sample Store C': '示例商家丙',
};

export const zhHans: Copy = {
  language: { name: '简体中文', intlLocale: 'zh-Hans-NZ' },
  meta: { title: 'WorthIt 值不值：买之前，先看值不值', description: '说出你想要的东西，WorthIt 按性价比、价格或做工帮你排好，并写明每条推荐的理由。' },
  a11y: { skip: '跳到推荐结果', home: 'WorthIt 首页', navigation: '页面导航', language: '选择语言', sort: '排序方式', newWindow: '（在新窗口打开）' },
  brand: 'WorthIt',
  brandLocal: '值不值',
  nav: [
    { href: '#rank', label: '怎么排序' },
    { href: '#rent', label: '租金对照' },
    { href: '#data', label: '数据来源' },
  ],
  hero: {
    title: '买之前，先看值不值',
    lede: '说出你想要的东西，我们按性价比、价格或做工替你排好。',
    inputLabel: '你想要什么？',
    placeholder: '比如：1500 刀以内的学生笔记本',
    submit: '帮我比一比',
    examplesLabel: '试试这些',
    examples: ['1500 刀以内的笔记本', '适合老人用的手机', '小公寓用的书桌'],
  },
  results: {
    titleDefault: '今天值得看的',
    titleQuery: (q: string) => `“${q}”的比较结果`,
    notice: '示例数据，非实时价格。',
    capturedOn: (date: string) => `示例日期： ${date}。`,
    count: (n: number) => `${n} 件`,
    excluded: (n: number) => `另有 ${n} 件因缺少照片或关键规格，没有进入这一栏。`,
    empty: '没有找到符合条件的示例商品。试试放宽预算，或者换一种说法。',
    clear: '清除搜索',
    more: (n: number) => `再看 ${n} 件`,
    viewAt: (merchant: string) => `去${sampleMerchants[merchant] ?? merchant}查看`,
    was: '原价',
    band: { low: '价格偏低', mid: '价格居中', high: '价格偏高' },
    condition: { new: '全新', refurbished: '翻新', used: '二手' },
    warranty: (m: number) => `保修 ${m} 个月`,
    rating: (r: number, n?: number) => (n ? `评分 ${r.toFixed(1)}（${n} 条）` : `评分 ${r.toFixed(1)}`),
    meterLabel: (pos: number) => `在同类示例商品的价格区间里，位于 ${pos}% 的位置`,
  },
  lanes: {
    value: { label: '性价比', hint: '价格和品质的平衡' },
    cheap: { label: '便宜', hint: '同类里价格偏低，且没有风险信号' },
    refined: { label: '精致', hint: '关注反馈、成色描述和保修，价格不一定低' },
  } satisfies Record<Lane, { label: string; hint: string }>,
  rank: {
    title: '我们怎么排序',
    lede: '每件商品只和同一品类的商品比较。每条推荐都写明理由，理由里的数字都能对回商品信息。',
    head: ['栏目', '怎么算', '我们不会说的话'],
    rows: [
      { lane: 'value' as Lane, how: '按价格在同类里的位置、反馈数量和图片数量打分，并要求提供关键规格。', never: '“最优选择”“闭眼买”' },
      { lane: 'cheap' as Lane, how: '价格落在同类的下四分位附近，并且没有缺图、缺规格这类风险信号。', never: '“全网最低”“保证最便宜”' },
      { lane: 'refined' as Lane, how: '按反馈数量、图片数量、具体成色描述和保修打分，价格可以高于中位。', never: '“奢侈品认证”“投资级”' },
    ],
  },
  rent: {
    title: '房租贵不贵？',
    lede: '选择郊区、房型和卧室数。每周租金只对照公布的那一行，不会把几个郊区合在一起算。',
    note: '郊区数字是一个统计区、一种房型、一种卧室数下仍在登记的押金，不是广告价。格子太小、没有公布时，回退到所属地区全部卧室的月度结果。那一份按新登记押金计算，没有按卧室拆开。发布有滞后。押金数据来自 MBIE，CC BY 3.0 NZ。郊区名称来自 Stats NZ 2019 SA2，CC BY 4.0。',
    link: '查看数据原始页面',
    href: 'https://www.tenancy.govt.nz/about-tenancy-services/data-and-statistics/rental-bond-data/',
    licence: 'CC BY 3.0 NZ',
    licenceHref: 'https://creativecommons.org/licenses/by/3.0/nz/',
    geography: 'Stats NZ 2019 SA2 名称',
    geographyHref: 'https://datafinder.stats.govt.nz/layer/98779-statistical-area-2-higher-geographies-2019-generalised/',
    geographyLicence: 'CC BY 4.0',
    geographyLicenceHref: 'https://creativecommons.org/licenses/by/4.0/',
    newWindow: '（在新标签页打开）',
    areaLabel: '地区',
    areaPlaceholder: '搜索地区',
    suburbLabel: '郊区',
    suburbPlaceholder: '搜索郊区',
    dwellingLabel: '房型',
    dwellings: {
      ALL: '全部房型',
      House: '独立屋',
      Flat: '平房',
      Apartment: '公寓',
      Room: '单间',
      'Boarding House': '寄宿屋',
    },
    beds: {
      ALL: '全部',
      '1': '1',
      '2': '2',
      '3': '3',
      '4': '4',
      '5': '5',
      '5+': '5 间或更多',
      '6': '6',
      NA: '未记录',
    },
    bedroomsLabel: '卧室数',
    bedrooms: {
      all: '全部',
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      '5+': '5 间或更多',
    },
    rentLabel: '每周租金（纽币）',
    rentPlaceholder: '650',
    prompt: '输入每周租金，查看它落在哪一档。',
    insufficient: '数据不足，登记的押金太少，无法给出区间。',
    suburbInsufficient: '数据不足，这个郊区、房型和卧室数没有公布足够的押金。',
    fallbackLead: '所属地区、全部卧室：',
    fallbackMissing: '月度地区文件里没有对应的地区，无法回退。',
    unsplit: '这份按月公布的地区文件没有按卧室数拆开。选择全部卧室，才能看到该地区的区间。',
    unknownArea: '请从列表中选择地区。',
    unknownSuburb: '请从列表中选择郊区。',
    oneBedroom: 'Tenancy Services 说明，一居室数据可能不准确，因为有些押金被记成一居室，实际卧室更多。',
    bands: {
      below: (area: string, month: string, rent: number, lower: number, _median: number, _upper: number, count: number) =>
        `每周 ${rent} 纽币，低于 ${area} 在 ${month} 新登记的 ${count.toLocaleString('zh-Hans')} 笔押金的下四分位 ${lower} 纽币。`,
      'lower-to-median': (area: string, month: string, rent: number, lower: number, median: number, _upper: number, count: number) =>
        `每周 ${rent} 纽币，落在 ${area} ${month} 新登记 ${count.toLocaleString('zh-Hans')} 笔押金的下四分位 ${lower} 纽币到中位 ${median} 纽币之间。`,
      'median-to-upper': (area: string, month: string, rent: number, _lower: number, median: number, upper: number, count: number) =>
        `每周 ${rent} 纽币，落在 ${area} ${month} 新登记 ${count.toLocaleString('zh-Hans')} 笔押金的中位 ${median} 纽币到上四分位 ${upper} 纽币之间。`,
      above: (area: string, month: string, rent: number, _lower: number, _median: number, upper: number, count: number) =>
        `每周 ${rent} 纽币，高于 ${area} 在 ${month} 新登记的 ${count.toLocaleString('zh-Hans')} 笔押金的上四分位 ${upper} 纽币。`,
    },
    suburbBands: {
      below: (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, lower: number, _median: number, _upper: number, count: number) =>
        `每周 ${rent} 纽币，低于 ${suburb}（${ta}，${period}，${dwelling}，${beds}）仍在登记的 ${count.toLocaleString('zh-Hans')} 笔押金的下四分位 ${lower} 纽币。`,
      'lower-to-median': (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, lower: number, median: number, _upper: number, count: number) =>
        `每周 ${rent} 纽币，落在 ${suburb}（${ta}，${period}，${dwelling}，${beds}）仍在登记的 ${count.toLocaleString('zh-Hans')} 笔押金的下四分位 ${lower} 纽币到中位 ${median} 纽币之间。`,
      'median-to-upper': (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, _lower: number, median: number, upper: number, count: number) =>
        `每周 ${rent} 纽币，落在 ${suburb}（${ta}，${period}，${dwelling}，${beds}）仍在登记的 ${count.toLocaleString('zh-Hans')} 笔押金的中位 ${median} 纽币到上四分位 ${upper} 纽币之间。`,
      above: (suburb: string, ta: string, period: string, dwelling: string, beds: string, rent: number, _lower: number, _median: number, upper: number, count: number) =>
        `每周 ${rent} 纽币，高于 ${suburb}（${ta}，${period}，${dwelling}，${beds}）仍在登记的 ${count.toLocaleString('zh-Hans')} 笔押金的上四分位 ${upper} 纽币。`,
    },
  },
  data: {
    title: '数据从哪来',
    lede: '我们只收录商家愿意提供、或者明确允许收录的商品。点击商品会跳到商家自己的页面下单。',
    head: ['来源', '现在的状态', '说明'],
    rows: [
      ['示例数据', '正在使用', '当前页面上的商品、商家和价格都是示例，用来演示排序方式。'],
      ['商家主动提供的商品数据', '计划接入', '商家提交商品数据，我们标明采集时间，点击跳转到商家页面。'],
      ['政府公开租金数据', '正在使用', 'MBIE 2026 年 7 月 1 日起这个季度的郊区存续押金，以及 2026 年 9 月的地区数字。CC BY 3.0 NZ，署名 MBIE。郊区名称来自 Stats NZ 2019 SA2，CC BY 4.0。'],
      ['明确禁止抓取的网站', '不收录', '对方条款或 robots.txt 禁止的，我们不抓取。'],
    ],
  },
  footer: 'WorthIt 2026。当前为示例阶段，页面上的商品和价格均为示例数据。',
};
