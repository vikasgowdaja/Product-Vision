import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['free', 'pro', 'enterprise'], default: 'free' })
  plan: 'free' | 'pro' | 'enterprise';

  @Column({ default: 0 })
  infographicsUsedThisMonth: number;

  // Encrypted LinkedIn OAuth token
  @Column({ nullable: true, select: false })
  linkedinAccessToken: string;

  @OneToMany('Infographic', 'user')
  infographics: any[];

  @CreateDateColumn()
  createdAt: Date;
}
