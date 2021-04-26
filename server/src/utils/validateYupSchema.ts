import { Field, ObjectType } from 'type-graphql';
import { ValidationError } from 'yup';
// export interface ValidationResponse {
//   name: string;
//   details: {
//     field: string;
//     value: string | number;
//     message: string;
//   };
// }

@ObjectType()
class DetailsType {
    @Field({ nullable: true })
    field: string;
    @Field({ nullable: true })
    value: string;
    @Field({ nullable: true })
    message: string;
}

interface ErrorInput {
    field: string;
    value: string;
    message: string;
}
@ObjectType()
export class GQLValidationError {
    @Field({ nullable: true })
    name = 'ValidationError';
    @Field({ nullable: true })
    details: DetailsType;

    constructor({ field, value, message }: ErrorInput) {
        this.details = {
            field,
            value,
            message
        };
    }
}

export const validateSchema = async (schema: any, object: any): Promise<GQLValidationError[] | null> => {
    return new Promise((resolve, reject) => {
        schema
            .validate(object, {
                abortEarly: false
            })
            .then(
                () => {
                    resolve(null);
                },
                (err: any) => {
                    if (err.inner.length === 0) resolve(null);

                    const errors = err.inner.map(
                        (err: ValidationError) =>
                            new GQLValidationError({
                                field: err.path ? err.path : '',
                                value: err.value,
                                message: err.message
                            })
                    );
                    resolve(errors);
                }
            );
    });
};
