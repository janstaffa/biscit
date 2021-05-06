import { Field, InputType } from 'type-graphql';

@InputType()
export class ThreadQueryInput {
  @Field()
  threadId: string;
}
