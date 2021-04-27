import { Field, InputType } from 'type-graphql';

@InputType()
export class ThreadQueryInput {
  @Field()
  threadId: string;
}

@InputType()
export class ThreadMessagesQueryInput {
  @Field()
  threadId: string;

  @Field(() => String, { nullable: true })
  cursor: string | null;

  @Field()
  limit: number;
}
