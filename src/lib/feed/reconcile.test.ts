import { describe, expect, it } from 'vitest';
import { reconcileFeed } from './reconcile';

const item = (id: string) => ({ id, price: 10 });

describe('reconcileFeed', () => {
  it('does not replace the feed when the collect stopped or came back empty', () => {
    const existing = [item('a'), item('b')];
    const stopped = reconcileFeed(existing, [item('a')], { a: 0 }, { stopped: true, capped: false });
    expect(stopped.wrote).toBe(false);
    expect(stopped.items).toEqual(existing);
    expect(stopped.misses).toEqual({ a: 0 });

    const empty = reconcileFeed(existing, [], { a: 0 }, { stopped: false, capped: false });
    expect(empty.wrote).toBe(false);
    expect(empty.items).toEqual(existing);
  });

  it('drops an item on the third complete collect that does not include it', () => {
    const first = reconcileFeed([item('a'), item('b')], [item('a')], {}, { stopped: false, capped: false });
    expect(first.items.map((row) => row.id)).toEqual(['a', 'b']);
    expect(first.misses.b).toBe(1);
    expect(first.dropped).toEqual([]);

    const second = reconcileFeed(first.items, [item('a')], first.misses, { stopped: false, capped: false });
    expect(second.misses.b).toBe(2);
    expect(second.items.map((row) => row.id)).toEqual(['a', 'b']);

    const third = reconcileFeed(second.items, [item('a')], second.misses, { stopped: false, capped: false });
    expect(third.dropped).toEqual(['b']);
    expect(third.items.map((row) => row.id)).toEqual(['a']);
    expect(third.misses.b).toBeUndefined();
  });

  it('resets the miss count when the item is seen again, and does not count misses when the run hit its cap', () => {
    const back = reconcileFeed([item('a'), item('b')], [item('b')], { b: 2 }, { stopped: false, capped: false });
    expect(back.misses.b).toBe(0);
    expect(back.misses.a).toBe(1);

    const capped = reconcileFeed([item('a'), item('b')], [item('a')], { b: 1 }, { stopped: false, capped: true });
    expect(capped.items.map((row) => row.id)).toEqual(['a', 'b']);
    expect(capped.misses.b).toBe(1);
    expect(capped.dropped).toEqual([]);
  });
});
