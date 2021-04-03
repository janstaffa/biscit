import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isUnique', async: false })
export class ContainsNumbersConstraint implements ValidatorConstraintInterface {
  public async validate(
    value: any,
    args: ValidationArguments
  ): Promise<boolean> {
    const property = args.property;
    if (/\d/.test(value)) return true;
    return false;
  }

  public defaultMessage(args: ValidationArguments) {
    return `$property must contain a number`;
  }
}

export const ContainsNumbers = (validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'containsNumbers',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: ContainsNumbersConstraint,
    });
  };
};
