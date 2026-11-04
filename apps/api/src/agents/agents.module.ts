import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentPipelineProcessor } from './agent-pipeline.processor';
import { Infographic } from '../infographics/entities/infographic.entity';
import { TrendResearchAgent } from '../../../../packages/agents/trend-research/src';
import { ContentStrategistAgent } from '../../../../packages/agents/content-strategist/src';
import { ContentWriterAgent } from '../../../../packages/agents/content-writer/src';
import { InfographicDesignerAgent } from '../../../../packages/agents/infographic-designer/src';
import { QualityVerifierAgent } from '../../../../packages/agents/quality-verifier/src';
import { LinkedInPublisherAgent } from '../../../../packages/agents/linkedin-publisher/src';

@Module({
  imports: [
    TypeOrmModule.forFeature([Infographic]),
    BullModule.registerQueue({ name: 'agent-pipeline' }),
  ],
  providers: [
    AgentPipelineProcessor,
    TrendResearchAgent,
    ContentStrategistAgent,
    ContentWriterAgent,
    InfographicDesignerAgent,
    QualityVerifierAgent,
    LinkedInPublisherAgent,
  ],
})
export class AgentsModule {}
