import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { TrendResult } from '../../trend-research/src';

export interface StrategyResult {
  hook: string;
  linkedinAngle: string;
  targetAudience: string;
  keyTakeaways: string[];
  contentFormat: 'comparison' | 'steps' | 'tips' | 'deep-dive' | 'case-study';
}

/**
 * Agent 2 — Content Strategist
 *
 * Takes trend research output and produces a LinkedIn content strategy:
 * a compelling hook, the angle to take, and key takeaways for the infographic.
 */
@Injectable()
export class ContentStrategistAgent {
  private _openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    }
    return this._openai;
  }

  async run(trend: TrendResult): Promise<StrategyResult> {
    const prompt = `
You are a LinkedIn content strategist specializing in technical content for software engineers.

Given this trending topic:
- Topic: ${trend.topic}
- Niche importance: ${trend.importance}/10
- Target audience: ${trend.audience}
- Context: ${trend.summary}

Create a LinkedIn content strategy with:
1. A compelling hook (2 sentences, creates curiosity or contrast)
2. The angle to take (what unique perspective or insight to offer)
3. 3–5 key takeaways for an infographic
4. Best content format (comparison | steps | tips | deep-dive | case-study)

Respond with valid JSON only, matching this schema:
{
  "hook": "...",
  "linkedinAngle": "...",
  "targetAudience": "...",
  "keyTakeaways": ["...", "..."],
  "contentFormat": "comparison"
}
`.trim();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content!) as StrategyResult;
  }
}
