import { describe, expect, it } from 'vitest';

import { parseMicroCardContent, serializeMicroCardContent } from './learning/micro-card';

describe('Shared Package', () => {
  it('should pass a basic truthy test', () => {
    expect(true).toBe(true);
  });

  it('should be able to perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('parses legacy and multi-card micro-card content', () => {
    expect(parseMicroCardContent({ front: '你', back: 'you' }).content.cards).toEqual([
      { front: '你', back: 'you' },
    ]);

    expect(
      parseMicroCardContent(JSON.stringify({ cards: [{ front: '好', back: 'good' }] })).content
        .cards,
    ).toEqual([{ front: '好', back: 'good' }]);
  });

  it('reports invalid micro-card entries', () => {
    const result = parseMicroCardContent({ cards: [{ front: 'missing back' }] });

    expect(result.content.cards).toEqual([]);
    expect(result.errors).toContain('MICRO_CARD_EMPTY');
  });

  it('serializes only complete micro-cards', () => {
    expect(
      serializeMicroCardContent([
        { front: ' 你 ', back: ' you ', pinyin: ' ni3 ' },
        { front: '', back: 'missing front' },
      ]),
    ).toBe(JSON.stringify({ cards: [{ front: '你', back: 'you', pinyin: 'ni3' }] }));
  });
});
