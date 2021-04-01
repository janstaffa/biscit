import { ValidationError } from 'class-validator';
import { ClassType, Field, ObjectType } from 'type-graphql';

export default function ResponseType<T>(TClass: ClassType<T>) {
  @ObjectType()
  class ResponseTypeClass {
    @Field(() => [ValidationError], { nullable: true })
    errors: ValidationError[] | null;

    @Field(() => [TClass], { nullable: true })
    data: T | null;
  }
  return ResponseTypeClass;
}
