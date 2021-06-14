import { Field, InputType } from 'type-graphql';

@InputType()
export class DeleteFileMutationInput {
  @Field()
  fileId: string;
}
