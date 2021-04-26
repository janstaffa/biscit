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
import { ThreadMembers } from './ThreadMembers';

@ObjectType()
@Entity()
export class Thread extends BaseEntity {
    @Field(() => String)
    @PrimaryColumn()
    id!: string;

    @BeforeInsert()
    private async generateId() {
        this.id = await getId(Thread, 'id');
    }

    @Field()
    @Column({ type: 'boolean' })
    isDm: boolean;

    @Field(() => String)
    @Column({ length: 100, nullable: true })
    name: string;

    @Field(() => [ThreadMembers])
    @OneToMany(() => ThreadMembers, (member) => member.thread)
    members: ThreadMembers[];

    @Field()
    @Column({ type: 'timestamptz', default: new Date() })
    lastActivity: Date;

    //createdAt field
    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    //updatedAt field
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
