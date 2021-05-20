import { Field, ObjectType } from 'type-graphql';
import { Message } from '../../entities/Message';
import { Thread } from '../../entities/Thread';
import { GQLValidationError } from '../../utils/validateYupSchema';

export interface ResponseType<T> {
  data: T | null;
  errors: GQLValidationError[] | [];
}
export interface ThreadMessagesResponseType {
  data: Message[] | null;
  nextMessage: Message | null;
  errors: GQLValidationError[] | [];
}

@ObjectType()
export class BooleanResponse {
  @Field()
  data: boolean;

  @Field(() => [GQLValidationError])
  errors: GQLValidationError[] | [];
}

@ObjectType()
export class ThreadResponse {
  @Field(() => Thread, { nullable: true })
  data: Thread;

  @Field(() => [GQLValidationError])
  errors: GQLValidationError[] | [];
}

@ObjectType()
export class ThreadMessagesResponse {
  @Field(() => [Message], { nullable: true })
  data: Message[];

  @Field(() => Message, { nullable: true })
  nextMessage: Message | null;

  @Field(() => [GQLValidationError])
  errors: GQLValidationError[] | [];
}
