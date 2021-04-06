import { GraphQLClient } from 'graphql-request';
import { useQuery, UseQueryOptions } from 'react-query';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };

function fetcher<TData, TVariables>(
  client: GraphQLClient,
  query: string,
  variables?: TVariables
) {
  return async (): Promise<TData> =>
    client.request<TData, TVariables>(query, variables);
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type LoginInput = {
  usernameOrEmail: Scalars['String'];
  password: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  UserRegister: User;
  UserLogin: Scalars['Boolean'];
  UserLogout: Scalars['Boolean'];
};

export type MutationUserRegisterArgs = {
  options: RegisterInput;
};

export type MutationUserLoginArgs = {
  options: LoginInput;
};

export type Query = {
  __typename?: 'Query';
  getAllUsers: Array<User>;
  me?: Maybe<User>;
};

export type RegisterInput = {
  username: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['String'];
  username: Scalars['String'];
  email: Scalars['String'];
  status: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type UserSnippetFragment = { __typename?: 'User' } & Pick<
  User,
  'id' | 'username' | 'email' | 'status' | 'bio'
>;

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = { __typename?: 'Query' } & {
  me?: Maybe<{ __typename?: 'User' } & UserSnippetFragment>;
};

export const UserSnippetFragmentDoc = `
    fragment userSnippet on User {
  id
  username
  email
  status
  bio
}
    `;
export const MeDocument = `
    query Me {
  me {
    ...userSnippet
  }
}
    ${UserSnippetFragmentDoc}`;
export const useMeQuery = <TData = MeQuery, TError = unknown>(
  client: GraphQLClient,
  variables?: MeQueryVariables,
  options?: UseQueryOptions<MeQuery, TError, TData>
) =>
  useQuery<MeQuery, TError, TData>(
    ['Me', variables],
    fetcher<MeQuery, MeQueryVariables>(client, MeDocument, variables),
    options
  );
