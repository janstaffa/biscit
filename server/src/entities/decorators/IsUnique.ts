import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { getRepository } from 'typeorm';

@ValidatorConstraint({ name: 'isUnique', async: false })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  public async validate(
    value: any,
    args: ValidationArguments
  ): Promise<boolean> {
    const property = args.property;
    const [repository] = args.constraints;

    const response = await getRepository(repository)
      .createQueryBuilder('table')
      .where(`table.${property} = :value`, { value: value })
      .getOne();

    if (response === undefined) return true;
    return false;
  }

  public defaultMessage(args: ValidationArguments) {
    return `$property must be unique`;
  }
}

export const IsUnique = (
  repository: any,
  validationOptions?: ValidationOptions
) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isUnique',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [repository],
      options: validationOptions,
      validator: IsUniqueConstraint,
    });
  };
};
