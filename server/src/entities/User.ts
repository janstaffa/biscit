import { IsEmail, Length, MaxLength } from 'class-validator';
import shortid from 'shortid';
import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsUnique } from './decorators/IsUnique';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  //id field
  @Field(() => String)
  @PrimaryColumn()
  id!: string;
  @BeforeInsert()
  generateId() {
    this.id = shortid.generate();
  }

  //username field (validation: length)
  @Field(() => String)
  @Column({ unique: true })
  @Length(1, 255)
  @IsUnique(User)
  username!: string;

  //username field (validation: email)
  @Field(() => String)
  @Column({ unique: true })
  @IsEmail()
  @IsUnique(User)
  email!: string;

  //password field (validation: length)
  @Column()
  @MaxLength(255)
  password!: string;

  //status field
  @Field(() => String)
  @Column({ default: 'offline' })
  status: string;

  //bio field
  @Field(() => String, { nullable: true })
  @Column({ length: 200, nullable: true })
  bio: string;

  //createdAt field
  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  //updatedAt field
  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
