import { Field, InputType } from 'type-graphql';

@InputType()
export class RequestAcceptInput {
    @Field()
    requestId: number;

    @Field()
    value: boolean;
}
@InputType()
export class RequestCancelInput {
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
    friendId: string;
}
