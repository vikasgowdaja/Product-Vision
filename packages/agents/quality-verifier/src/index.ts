import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { ContentResult } from '../../content-writer/src';
import type { DesignResult } from '../../infographic-designer/src';

export interface VerifyResult {
  passed: boolean;
  score: number;      // 0–100
  issues: string[];
  suggestions: string[];
}

interface VerifyInput {
  content: ContentResult;
  design: DesignResult;
}

/**
 * Agent 5 — Quality Verifier
 *
 * Uses Anthropic Claude to independently verify:
 * - Technical accuracy
 * - Grammar and clarity
 * - LinkedIn readability score
 * - Brand consistency
 * - No hallucinations or misleading claims
 *
 * Using a different model provider (Claude) than the generation agents
 * (GPT-4o) provides genuine independence in quality assessment.
 */
@Injectable()
export class QualityVerifierAgent {
  private _anthropic: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {}

  private get anthropic(): Anthropic {
    if (!this._anthropic) {
      this._anthropic = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
    }
    return this._anthropic;
  }

  async run({ content }: VerifyInput): Promise<VerifyResult> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `
You are a senior technical editor reviewing a LinkedIn infographic before publishing.

Review the following content and assess:
1. Technical accuracy (are the claims correct and not misleading?)
2. Grammar and writing quality
3. LinkedIn readability (is it scannable, engaging, appropriate length?)
4. Brand safety (no controversial claims, inclusive language)

Content to review:
---
Title: ${content.title}

Body:
${content.body}

Caption:
${content.caption}

CTA: ${content.cta}
---

Respond with valid JSON only:
{
  "passed": true,
  "score": 85,
  "issues": [],
  "suggestions": ["Consider adding a specific metric to strengthen the hook."]
}

Only set "passed": false if there are serious issues (factual errors, harmful content, unreadable text).
`.trim(),
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
    return JSON.parse(text) as VerifyResult;
  }
}
