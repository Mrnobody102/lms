export interface MicroCardItem {
  id?: string;
  front: string;
  pinyin?: string;
  back: string;
  example?: string;
  audioUrl?: string;
}

export interface MicroCardContent {
  cards: MicroCardItem[];
}

export interface MicroCardParseResult {
  content: MicroCardContent;
  errors: string[];
}

export function parseMicroCardContent(input: unknown): MicroCardParseResult {
  const parsed = typeof input === 'string' ? parseJson(input) : input;
  if (parsed === null) {
    return emptyResult(['MICRO_CARD_INVALID_JSON']);
  }

  const rawCards = readRawCards(parsed);
  if (rawCards.length === 0) {
    return emptyResult(['MICRO_CARD_EMPTY']);
  }

  const cards: MicroCardItem[] = [];
  const errors: string[] = [];

  rawCards.forEach((rawCard, index) => {
    const card = normalizeMicroCard(rawCard);
    if (card) {
      cards.push(card);
      return;
    }

    errors.push(`MICRO_CARD_${index + 1}_INVALID`);
  });

  if (cards.length === 0) {
    errors.push('MICRO_CARD_EMPTY');
  }

  return {
    content: { cards },
    errors,
  };
}

export function serializeMicroCardContent(cards: MicroCardItem[]): string {
  return JSON.stringify({
    cards: cards
      .map((card) => ({
        ...(card.id?.trim() ? { id: card.id.trim() } : {}),
        front: card.front.trim(),
        back: card.back.trim(),
        ...(card.pinyin?.trim() ? { pinyin: card.pinyin.trim() } : {}),
        ...(card.example?.trim() ? { example: card.example.trim() } : {}),
        ...(card.audioUrl?.trim() ? { audioUrl: card.audioUrl.trim() } : {}),
      }))
      .filter((card) => card.front && card.back),
  });
}

export function isValidMicroCardContent(input: unknown): boolean {
  const result = parseMicroCardContent(input);
  return result.content.cards.length > 0 && result.errors.length === 0;
}

function parseJson(input: string) {
  if (!input.trim()) {
    return null;
  }

  try {
    return JSON.parse(input) as unknown;
  } catch {
    return null;
  }
}

function readRawCards(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  const record = input as Record<string, unknown>;
  if (Array.isArray(record.cards)) {
    return record.cards;
  }

  return [record];
}

function normalizeMicroCard(input: unknown): MicroCardItem | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Record<string, unknown>;
  const front = readRequiredString(record.front);
  const back = readRequiredString(record.back);

  if (!front || !back) {
    return null;
  }

  return {
    front,
    back,
    id: readOptionalString(record.id),
    pinyin: readOptionalString(record.pinyin),
    example: readOptionalString(record.example),
    audioUrl: readOptionalString(record.audioUrl),
  };
}

function readRequiredString(input: unknown) {
  return typeof input === 'string' && input.trim() ? input.trim() : null;
}

function readOptionalString(input: unknown) {
  return typeof input === 'string' && input.trim() ? input.trim() : undefined;
}

function emptyResult(errors: string[]): MicroCardParseResult {
  return {
    content: { cards: [] },
    errors,
  };
}
