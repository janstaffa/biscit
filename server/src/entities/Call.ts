import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Thread } from './Thread';
import { User } from './User';

@ObjectType()
@Entity()
export class Call extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    if (!this.id) {
      this.id = await getId(Call, 'id');
    }
  }

  @Field(() => Boolean)
  @Column({ default: false })
  accepted: boolean;

  @Field(() => String)
  @Column()
  creatorId: string;

  @Field()
  @Column()
  threadId: string;

  @Field(() => Thread)
  @OneToOne(() => Thread, (thread) => thread.call, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: Thread;

  @Field(() => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.call, { nullable: true })
  members: User[];

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
