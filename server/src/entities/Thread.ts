import fs from 'fs';
import path from 'path';
import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  BeforeRemove,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { File } from './File';
import { Message } from './Message';
import { ProfilePicture } from './ProfilePicture';
import { ThreadMembers } from './ThreadMembers';
import { User } from './User';

@ObjectType()
@Entity()
export class Thread extends BaseEntity {
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  private async generateId() {
    if (!this.id) {
      this.id = await getId(Thread, 'id');
    }
  }

  @BeforeRemove()
  private async removeFiles() {
    const files = await File.find({ where: { threadId: this.id } });
    files.forEach((file) => {
      fs.unlink(
        path.join(
          __dirname,
          '../../uploaded',
          file.id.replace(/\./g, '') + (file.format ? '.' + file.format.replace(/\./g, '') : '')
        ),
        async (err) => {
          try {
            if (err) {
              console.error(err);
              return;
            }
            await File.remove(files);
          } catch (e) {
            console.error(e);
          }
        }
      );
    });
  }

  @Field()
  @Column({ type: 'boolean' })
  isDm: boolean;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  creatorId: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.myThreads, { nullable: true })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @Field(() => String, { nullable: true })
  @Column({ length: 100, nullable: true })
  name: string;

  @Field(() => [ThreadMembers])
  @OneToMany(() => ThreadMembers, (member) => member.thread)
  members: ThreadMembers[];

  @OneToMany(() => Message, (message) => message.thread)
  messages: Message[];

  @Field(() => Number)
  messagesCount: number;

  @Field(() => Message, { nullable: true })
  lastMessage: Message;

  @Field()
  @Column({ type: 'timestamptz', default: new Date() })
  lastActivity: Date;

  @Field(() => [File], { nullable: true })
  @OneToMany(() => File, (file) => file.thread, { nullable: true })
  media: File[];

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  thread_pictureId: string;

  @Field(() => ProfilePicture, { nullable: true })
  @OneToOne(() => ProfilePicture, (profile_picture) => profile_picture.thread)
  thread_picture: ProfilePicture;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
