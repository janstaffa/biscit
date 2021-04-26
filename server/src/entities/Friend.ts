import { Field, ObjectType } from 'type-graphql';
import {
    BaseEntity,
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn
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
    private async generateId() {
        this.id = await getId(Friend, 'id');
    }

    @Field(() => String)
    @Column()
    key: string;

    @Field(() => String)
    @Column()
    userId: string;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Field(() => String)
    @Column()
    friendId: string;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.friends, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'friendId' })
    friend: User;

    @Field()
    @Column()
    threadId: string;

    //createdAt field
    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    //updatedAt field
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
