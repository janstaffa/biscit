import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Friend } from './Friend';
import { FriendRequest } from './FriendRequest';
import { Message } from './Message';
import { ThreadMembers } from './ThreadMembers';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  //id field
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    this.id = await getId(User, 'id');
  }

  //username field
  @Field(() => String)
  @Column({ unique: true })
  username!: string;

  //username field
  @Field(() => String)
  @Column({ unique: true })
  email!: string;

  //password field
  @Column()
  password!: string;

  //status field
  @Field(() => String)
  @Column({ default: 'offline' })
  status: string;

  //bio field
  @Field(() => String, { nullable: true })
  @Column({ length: 100, nullable: true })
  bio: string;

  //friend requests
  @OneToMany(() => FriendRequest, (request) => request.sender || request.reciever)
  friend_requests: FriendRequest[];

  //friends field
  @Field(() => [Friend], { nullable: true })
  @OneToMany(() => Friend, (friend) => friend.user)
  friends: Friend[];

  //treads field
  @Field(() => [ThreadMembers], { nullable: true })
  @OneToMany(() => ThreadMembers, (thread) => thread.user)
  threads: ThreadMembers[];

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
