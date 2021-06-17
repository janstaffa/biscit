import { Field, InputType } from 'type-graphql';

@InputType()
export class CreateCallMutationInput {
  @Field()
  threadId: string;
}

@InputType()
export class CancelCallMutationInput {
  @Field()
  threadId: string;
}
