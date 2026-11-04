import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { TrendResult } from '../../trend-research/src';
import type { StrategyResult } from '../../content-strategist/src';

export interface ContentResult {
  title: string;
  body: string;         // structured infographic body (markdown-lite)
  caption: string;      // LinkedIn post caption
  cta: string;          // call to action
}

interface ContentInput {
  trendResult: TrendResult;
  strategyResult: StrategyResult;
}

/**
 * Agent 3 — Content Writer
 *
 * Produces the infographic body content, LinkedIn caption, and CTA
 * based on the trend research and content strategy.
 */
@Injectable()
export class ContentWriterAgent {
  private _openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    }
    return this._openai;
  }

  async run({ trendResult, strategyResult }: ContentInput): Promise<ContentResult> {
    const prompt = `
You are a technical content writer creating LinkedIn infographics for software engineers.

Topic: ${trendResult.topic}
Audience: ${trendResult.audience}
Hook: ${strategyResult.hook}
LinkedIn Angle: ${strategyResult.linkedinAngle}
Content Format: ${strategyResult.contentFormat}
Key Takeaways: ${strategyResult.keyTakeaways.join(' | ')}

Write:
1. A short infographic title (max 8 words)
2. Structured infographic body using this format:
   - Use sections with emoji headers
   - Use ✓ bullets for lists
   - Max 120 words total
   - Clear, scannable on mobile
3. A LinkedIn post caption (150–200 words, conversational, no fluff)
4. A strong CTA (one line, e.g. "Save this for your next architecture review.")

Respond with valid JSON only:
{
  "title": "...",
  "body": "...",
  "caption": "...",
  "cta": "..."
}
`.trim();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(completion.choices[0].message.content!) as ContentResult;
  }
}
