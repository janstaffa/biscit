import { DetailsType, GqlValidationError } from '../generated/graphql';

export const toErrorMap = (errors: GqlValidationError[]) => {
  if (!errors || errors.length === 0) return;

  const errorMap: Record<string, string> = {};

  errors.forEach((err) => {
    const { field, message } = err.details as DetailsType;

    if (field && message) {
      errorMap[field] = message;
    }
  });

  return errorMap;
};
