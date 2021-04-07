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

@ObjectType()
@Entity()
export class User extends BaseEntity {
  //id field
  @Field(() => String)
  @PrimaryColumn()
  id!: string;

  @BeforeInsert()
  async generateId() {
    const getId = async (resolve: (id: string) => void): Promise<any> => {
      const id: string = shortid.generate();
      const check = await User.findOne({ where: { id } });
      if (check) return getId(resolve);
      resolve(id);
    };

    await new Promise<string>((resolve: (id: string) => void) => {
      getId(resolve);
    }).then((id) => {
      this.id = id;
    });
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
