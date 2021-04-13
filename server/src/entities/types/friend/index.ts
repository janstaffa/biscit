import { Field, InputType } from 'type-graphql';

@InputType()
export class FriendAcceptInput {
  @Field()
  requestId: number;
}

@InputType()
export class FriendRequestInput {
  @Field()
  username: string;
}

@InputType()
export class FriendRemoveInput {
  @Field()
  userId: string;
}
