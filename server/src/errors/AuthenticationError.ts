import { ApolloError } from 'apollo-server-errors';

export class AuthenticationError extends ApolloError {
  public details: {
    field: string;
    value: string;
  };
  constructor(field: string, value: string) {
    super(field, value);
    this.message = 'Authentication Error';
    this.details = {
      field,
      value,
    };
  }
}
