import { Field, InputType } from 'type-graphql';

@InputType()
export class FriendAcceptInput {
  @Field()
  requestId: number;
}
