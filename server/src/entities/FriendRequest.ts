import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@ObjectType()
@Entity()
export class FriendRequest extends BaseEntity {
  //id field
  @Field(() => Number)
  @PrimaryGeneratedColumn()
  id: number;

  //senderId field
  @Field(() => String)
  @Column()
  senderId: string;

  //sender field
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.friend_requests)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  //recieverId field
  @Field()
  @Column()
  recieverId: string;

  //reciever field
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.friend_requests)
  @JoinColumn({ name: 'recieverId' })
  reciever: User;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
