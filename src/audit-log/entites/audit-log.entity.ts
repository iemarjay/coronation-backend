import { Asset } from 'src/asset/entities/asset.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

export enum Method {
  download = 'download',
  upload = 'upload',
  activate = 'activate',
  deactivate = 'deactivate',
  update = 'update',
  delete = 'delete',
  login_email = 'login_email',
  login_microsoft = 'login_microsoft',
  logout = 'logout',
  login_failed = 'login_failed',
}

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    enum: Method,
  })
  method: Method;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'CASCADE' })
  asset: Asset;

  @Column({ nullable: true })
  loginMethod: string;

  @Column({ nullable: true })
  failureReason: string;
}
