import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Thread } from './Thread';
import { User } from './User';

@ObjectType()
@Entity()
export class Message extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    this.id = await getId(Message, 'id');
  }

  @Field(() => String)
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field()
  @Column()
  threadId: string;

  @ManyToOne(() => Thread, (thread) => thread.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: Thread;

  @Field()
  @Column()
  content: string;

  @Field()
  @Column({ default: false })
  edited: boolean;

  @Field()
  @Column({ nullable: true })
  replyingToId: string;

  @Field(() => Message, { nullable: true })
  @ManyToOne(() => Message, (message) => message.replies)
  @JoinColumn({ name: 'replyingToId' })
  replyingTo: Message;

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, (message) => message.replyingTo, { nullable: true })
  replies: Message[];

  @Field()
  @Column({ default: false })
  resended: boolean;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
