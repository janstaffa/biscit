import { Field, InputType } from 'type-graphql';

@InputType()
export class ThreadMessagesQueryInput {
  @Field()
  threadId: string;

  @Field(() => String, { nullable: true })
  cursor: string | null;

  @Field()
  limit: number;
}
