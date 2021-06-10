import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Thread } from './Thread';
import { User } from './User';

@ObjectType()
@Entity()
export class ProfilePicture extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    if (!this.id) {
      this.id = await getId(ProfilePicture, 'id');
    }
  }

  @Field()
  @Column()
  size: number;

  @Field()
  @Column()
  fileName: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  format: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  userId: string;

  @Field(() => User, { nullable: true })
  @OneToOne(() => User, (user) => user.profile_picture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  threadId: string;

  @Field(() => Thread, { nullable: true })
  @OneToOne(() => Thread, (thread) => thread.thread_picture, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: Thread;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
