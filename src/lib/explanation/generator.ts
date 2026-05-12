import Anthropic from '@anthropic-ai/sdk';
import { PickAnalysis } from '@/lib/contracts/analysis';
import { buildExplainPrompt } from './prompts';

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 200;
const TIMEOUT_MS = 8000;

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function generateExplanation(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  pick: PickAnalysis,
  market: string
): Promise<string | null> {
  try {
    const prompt = buildExplainPrompt(homeTeam, awayTeam, competition, pick, market);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await getClient().messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timer);

    const text = response.content[0];
    if (text.type !== 'text') return null;
    return text.text.trim() || null;
  } catch (err) {
    console.error('[explanation] generation failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
