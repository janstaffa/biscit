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

@InputType()
export class DeleteMessageMutationInput {
  @Field()
  messageId: string;
}

@InputType()
export class UpdateMessageMutationInput {
  @Field()
  messageId: string;

  @Field()
  newContent: string;
}
