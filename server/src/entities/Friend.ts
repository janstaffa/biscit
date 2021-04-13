import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { getId } from '../utils/generateId';
import { User } from './User';

@ObjectType()
@Entity()
export class Friend extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  async generateId() {
    this.id = await getId(Friend);
  }

  @Field(() => String)
  @Column()
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.friends)
  user: User;

  @Field(() => String)
  @Column()
  friendId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user)
  friend: User;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
