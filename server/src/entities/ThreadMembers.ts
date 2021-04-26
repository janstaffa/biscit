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
import { Thread } from './Thread';
import { User } from './User';

@ObjectType()
@Entity()
export class ThreadMembers extends BaseEntity {
    @Field(() => String)
    @PrimaryColumn()
    id!: string;

    @BeforeInsert()
    private async generateId() {
        this.id = await getId(ThreadMembers, 'id');
    }

    @Field()
    @Column()
    threadId: string;

    @Field()
    @ManyToOne(() => Thread, (thread) => thread.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'threadId' })
    thread: Thread;

    @Field()
    @Column()
    userId: string;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.threads, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Field()
    @Column({ type: 'boolean', default: false })
    isAdmin: boolean;

    @Field()
    @Column({ default: 0 })
    unread: number;

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
