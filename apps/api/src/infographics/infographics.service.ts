import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Infographic } from './entities/infographic.entity';
import { CreateInfographicDto } from './dto/create-infographic.dto';

@Injectable()
export class InfographicsService {
  constructor(
    @InjectRepository(Infographic)
    private readonly infographicRepo: Repository<Infographic>,
    @InjectQueue('agent-pipeline')
    private readonly pipelineQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateInfographicDto): Promise<Infographic> {
    const infographic = this.infographicRepo.create({
      user: { id: userId } as any,
      niche: dto.niche,
      topic: dto.topic,
      status: 'pending',
    });
    const saved = await this.infographicRepo.save(infographic);

    // Enqueue the 6-agent pipeline
    await this.pipelineQueue.add('run-pipeline', {
      infographicId: saved.id,
      userId,
      niche: dto.niche,
      topic: dto.topic,
    });

    return saved;
  }

  async findAllByUser(userId: string): Promise<Infographic[]> {
    return this.infographicRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Infographic> {
    const infographic = await this.infographicRepo.findOne({
      where: { id, user: { id: userId } },
    });
    if (!infographic) throw new NotFoundException('Infographic not found');
    return infographic;
  }

  async schedule(userId: string, id: string, scheduledAt: Date): Promise<Infographic> {
    const infographic = await this.findOne(userId, id);
    if (infographic.status === 'published') {
      throw new ForbiddenException('Cannot reschedule an already published infographic');
    }
    infographic.scheduledAt = scheduledAt;
    infographic.status = 'scheduled';
    return this.infographicRepo.save(infographic);
  }

  async remove(userId: string, id: string): Promise<void> {
    const infographic = await this.findOne(userId, id);
    await this.infographicRepo.remove(infographic);
  }
}
