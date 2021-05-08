import { Field, InputType } from 'type-graphql';

@InputType()
export class ThreadInput {
  @Field()
  threadId: string;
}
