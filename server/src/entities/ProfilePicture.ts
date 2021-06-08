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

  @Field(() => String)
  @Column()
  userId: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.profile_picture, { onDelete: 'CASCADE' })
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
