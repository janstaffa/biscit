import { Field, InputType } from 'type-graphql';

@InputType()
export class FriendRequestInput {
  @Field()
  username: string;
}
