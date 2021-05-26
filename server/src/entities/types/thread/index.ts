import { Field, InputType } from 'type-graphql';

@InputType()
export class ThreadInput {
  @Field()
  threadId: string;
}

@InputType()
export class CreateThreadInput {
  @Field()
  threadName: string;

  @Field(() => [String], { nullable: true })
  members: string[] | null;
}
