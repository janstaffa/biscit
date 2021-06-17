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
import { getTag } from '../utils/generateTag';
import { Call } from './Call';
import { File } from './File';
import { Friend } from './Friend';
import { FriendRequest } from './FriendRequest';
import { Message } from './Message';
import { ProfilePicture } from './ProfilePicture';
import { Thread } from './Thread';
import { ThreadMembers } from './ThreadMembers';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  //id field
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateIds() {
    this.id = await getId(User, 'id');
    this.tag = await getTag(User, 'tag');
  }

  //tag field
  @Field(() => String)
  @Column({ unique: true })
  tag!: string;
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

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profile_pictureId: string;

  @Field(() => ProfilePicture, { nullable: true })
  @OneToOne(() => ProfilePicture, (profile_picture) => profile_picture.user, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profile_pictureId' })
  profile_picture: ProfilePicture;

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

  @OneToMany(() => ThreadMembers, (thread) => thread.user)
  threads: ThreadMembers[];

  @Field(() => [Thread])
  @OneToMany(() => Thread, (thread) => thread.creator, { nullable: true })
  myThreads: Thread[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @Field(() => Boolean)
  @Column({ default: true })
  soundNotifications: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  setAsUnread: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  allowFriendRequests: boolean;

  @Field(() => Boolean)
  @Column({ default: true })
  allowThreads: boolean;

  @Field(() => [Call], { nullable: true })
  @OneToMany(() => Call, (call) => call.creator, { nullable: true })
  calls: Call[];

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
