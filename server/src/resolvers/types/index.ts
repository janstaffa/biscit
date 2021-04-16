import { Field, ObjectType } from 'type-graphql';
import { Thread } from '../../entities/Thread';
import { GQLValidationError } from '../../utils/validateYupSchema';

export interface ResponseType<T> {
  data: T | null;
  errors: GQLValidationError[] | null;
}

@ObjectType()
export class BooleanResponse {
  @Field()
  data: boolean;

  @Field(() => [GQLValidationError])
  errors: GQLValidationError[];
}

@ObjectType()
export class ThreadResponse {
  @Field(() => Thread, { nullable: true })
  data: Thread;

  @Field(() => [GQLValidationError])
  errors: GQLValidationError[];
}
