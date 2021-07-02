import { Field, InputType } from 'type-graphql';

@InputType()
export class LoginInput {
  @Field()
  usernameOrEmail: string;

  @Field()
  password: string;
}

@InputType()
export class RegisterInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  confirmPassword: string;
}

@InputType()
export class UpdateStatusInput {
  @Field()
  status: string;
}

@InputType()
export class UpdateSettingsInput {
  @Field(() => String, { nullable: true })
  newUsername?: string;

  @Field(() => String, { nullable: true })
  newEmail?: string;

  @Field(() => Boolean, { nullable: true })
  soundNotifications?: boolean;

  @Field(() => Boolean, { nullable: true })
  setAsUnread?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowFriendRequests?: boolean;

  @Field(() => Boolean, { nullable: true })
  allowThreads?: boolean;

  @Field(() => Boolean, { nullable: true })
  autoUpdate?: boolean;
}
