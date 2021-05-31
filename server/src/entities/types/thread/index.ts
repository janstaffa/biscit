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

@InputType()
export class EditThreadInput {
  @Field()
  threadId: string;

  @Field()
  newName: string;
}

@InputType()
export class RemoveMemberInput {
  @Field()
  threadId: string;

  @Field()
  userId: string;
}

@InputType()
export class AddMemberInput {
  @Field()
  threadId: string;

  @Field(() => [String])
  newMembers: string[];
}
