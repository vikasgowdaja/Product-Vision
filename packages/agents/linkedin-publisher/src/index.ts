import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ContentResult } from '../../content-writer/src';

export interface PublishResult {
  caption: string;
  hashtags: string[];
  linkedinPostBody: string;
}

interface PublishInput {
  content: ContentResult;
  imageUrl: string;
}

/**
 * Agent 6 — LinkedIn Publisher Agent
 *
 * Prepares the final LinkedIn post:
 * - Formats the caption for LinkedIn's algorithm (line breaks, spacing)
 * - Generates relevant hashtags (max 5, targeted)
 * - Assembles the full post body
 *
 * Actual publishing uses the LinkedIn API v2 (UGC Posts endpoint).
 * OAuth tokens are stored per-user in the database.
 */
@Injectable()
export class LinkedInPublisherAgent {
  private _openai: OpenAI | null = null;

  constructor(private readonly config: ConfigService) {}

  private get openai(): OpenAI {
    if (!this._openai) {
      this._openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    }
    return this._openai;
  }

  /** Prepare the post content (does NOT publish — scheduling is separate) */
  async prepare({ content }: PublishInput): Promise<PublishResult> {
    const hashtags = await this.generateHashtags(content);
    const linkedinPostBody = this.formatForLinkedIn(content, hashtags);

    return {
      caption: content.caption,
      hashtags,
      linkedinPostBody,
    };
  }

  /** Publish immediately via LinkedIn API v2 */
  async publish(userId: string, result: PublishResult, imageUrl: string): Promise<string> {
    // TODO: implement LinkedIn UGC Post API call
    // 1. Retrieve user's LinkedIn access token from DB
    // 2. Upload image to LinkedIn media API
    // 3. Create UGC Post with image asset URN
    // 4. Return LinkedIn post ID
    throw new Error('LinkedIn publish not yet implemented');
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async generateHashtags(content: ContentResult): Promise<string[]> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Generate exactly 5 relevant LinkedIn hashtags for this post. Return JSON array only.
Post title: ${content.title}
Post body: ${content.body}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content!);
    return (parsed.hashtags as string[]) ?? [];
  }

  private formatForLinkedIn(content: ContentResult, hashtags: string[]): string {
    return [
      content.caption,
      '',
      content.cta,
      '',
      hashtags.join(' '),
    ].join('\n');
  }
}
