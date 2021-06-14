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
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { getId } from '../utils/generateId';
import { Thread } from './Thread';
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

  @BeforeRemove()
  private async removeFile() {
    console.log('here', this);
    fs.unlink(
      path.join(
        __dirname,
        '../../uploaded',
        this.id.replace(/\./g, '') + (this.format ? '.' + this.format.replace(/\./g, '') : '')
      ),
      async (err) => {
        try {
          if (err) throw err;
        } catch (e) {
          console.error(e);
        }
      }
    );
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
  userId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field()
  @Column()
  threadId: string;

  @ManyToOne(() => Thread, (thread) => thread.media, { onDelete: 'CASCADE' })
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
