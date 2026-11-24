/** NZC (nzc.kiwi), Greenlane, Auckland. robots allows /car/, but pages are a client-rendered app: the HTML is an empty #root and stock arrives from an API. */
export default {
  id: 'nzc',
  name: 'NZC',
  origin: 'https://nzc.kiwi',
  kind: 'vehicle',
  enabled: false,
  disabledReason: 'client-rendered (empty #root, stock loaded by script); needs the browser fetcher from docs/collector-adr.md "When to revisit"',
};
