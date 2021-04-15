import { Field, ObjectType } from 'type-graphql';
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
