import { Field, InputType } from 'type-graphql';

@InputType()
export class FriendAcceptInput {
  @Field()
  requestId: number;
}
@InputType()
export class RequestCancelInput extends FriendAcceptInput {}
@InputType()
export class FriendRequestInput {
  @Field()
  username: string;
}

@InputType()
export class FriendRemoveInput {
  @Field()
  friendId: string;
}
