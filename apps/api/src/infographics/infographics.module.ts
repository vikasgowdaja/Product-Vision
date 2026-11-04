import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InfographicsController } from './infographics.controller';
import { InfographicsService } from './infographics.service';
import { Infographic } from './entities/infographic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Infographic]),
    BullModule.registerQueue({ name: 'agent-pipeline' }),
  ],
  controllers: [InfographicsController],
  providers: [InfographicsService],
  exports: [InfographicsService],
})
export class InfographicsModule {}
