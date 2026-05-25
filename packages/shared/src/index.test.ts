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
    expect(
      parseMicroCardContent({ front: 'collaborate', back: 'work together' }).content.cards,
    ).toEqual([{ front: 'collaborate', back: 'work together' }]);

    expect(
      parseMicroCardContent(
        JSON.stringify({ cards: [{ front: 'analyze', back: 'examine carefully' }] }),
      ).content.cards,
    ).toEqual([{ front: 'analyze', back: 'examine carefully' }]);
  });

  it('reports invalid micro-card entries', () => {
    const result = parseMicroCardContent({ cards: [{ front: 'missing back' }] });

    expect(result.content.cards).toEqual([]);
    expect(result.errors).toContain('MICRO_CARD_EMPTY');
  });

  it('serializes only complete micro-cards', () => {
    expect(
      serializeMicroCardContent([
        { front: ' collaborate ', back: ' work together ', phonetics: ' /kəˈlæbəreɪt/ ' },
        { front: '', back: 'missing front' },
      ]),
    ).toBe(
      JSON.stringify({
        cards: [{ front: 'collaborate', back: 'work together', phonetics: '/kəˈlæbəreɪt/' }],
      }),
    );
  });
});
