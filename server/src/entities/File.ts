import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Message } from './Message';
import { User } from './User';

@ObjectType()
@Entity()
export class File extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    if (!this.id) {
      this.id = await getId(File, 'id');
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

  @Field(() => String)
  @Column()
  messageId: string;

  @Field(() => Message)
  @ManyToOne(() => Message, (message) => message.media)
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Field(() => String)
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
