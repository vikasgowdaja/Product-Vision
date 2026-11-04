import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type InfographicStatus =
  | 'pending'
  | 'researching'
  | 'strategizing'
  | 'writing'
  | 'designing'
  | 'verifying'
  | 'scheduled'
  | 'published'
  | 'failed';

@Entity('infographics')
export class Infographic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.infographics, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  niche: string;

  @Column({ nullable: true })
  topic: string;

  @Column({ type: 'int', nullable: true })
  trendScore: number;

  @Column({ nullable: true })
  hook: string;

  @Column({ type: 'text', nullable: true })
  bodyContent: string;

  @Column({ type: 'text', nullable: true })
  caption: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[];

  /** S3 URL of the generated PNG/SVG */
  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  svgSource: string;

  @Column({
    type: 'enum',
    enum: ['pending','researching','strategizing','writing','designing','verifying','scheduled','published','failed'],
    default: 'pending',
  })
  status: InfographicStatus;

  @Column({ nullable: true })
  linkedinPostId: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  agentTrace: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
