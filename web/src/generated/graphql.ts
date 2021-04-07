import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from 'react-query';
import { useGQLRequest } from '../utils/useGQLRequest';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type DetailsType = {
  __typename?: 'DetailsType';
  field?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type GqlValidationError = {
  __typename?: 'GQLValidationError';
  name?: Maybe<Scalars['String']>;
  details?: Maybe<DetailsType>;
};

export type LoginInput = {
  usernameOrEmail: Scalars['String'];
  password: Scalars['String'];
};

export type LoginResponse = {
  __typename?: 'LoginResponse';
  data: Scalars['Boolean'];
  errors?: Maybe<Array<GqlValidationError>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  UserRegister: UserResponse;
  UserLogin: LoginResponse;
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
  confirmPassword: Scalars['String'];
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

export type UserResponse = {
  __typename?: 'UserResponse';
  data?: Maybe<User>;
  errors?: Maybe<Array<GqlValidationError>>;
};

export type ErrorSnippetFragment = (
  { __typename?: 'GQLValidationError' }
  & Pick<GqlValidationError, 'name'>
  & { details?: Maybe<(
    { __typename?: 'DetailsType' }
    & Pick<DetailsType, 'field' | 'value' | 'message'>
  )> }
);

export type UserSnippetFragment = (
  { __typename?: 'User' }
  & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>
);

export type LoginMutationVariables = Exact<{
  options: LoginInput;
}>;


export type LoginMutation = (
  { __typename?: 'Mutation' }
  & { UserLogin: (
    { __typename?: 'LoginResponse' }
    & Pick<LoginResponse, 'data'>
    & { errors?: Maybe<Array<(
      { __typename?: 'GQLValidationError' }
      & ErrorSnippetFragment
    )>> }
  ) }
);

export type GetAllUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllUsersQuery = (
  { __typename?: 'Query' }
  & { getAllUsers: Array<(
    { __typename?: 'User' }
    & UserSnippetFragment
  )> }
);

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = (
  { __typename?: 'Query' }
  & { me?: Maybe<(
    { __typename?: 'User' }
    & UserSnippetFragment
  )> }
);

export const ErrorSnippetFragmentDoc = `
    fragment errorSnippet on GQLValidationError {
  name
  details {
    field
    value
    message
  }
}
    `;
export const UserSnippetFragmentDoc = `
    fragment userSnippet on User {
  id
  username
  email
  status
  bio
}
    `;
export const LoginDocument = `
    mutation Login($options: LoginInput!) {
  UserLogin(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useLoginMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<LoginMutation, TError, LoginMutationVariables, TContext>) => 
    useMutation<LoginMutation, TError, LoginMutationVariables, TContext>(
      useGQLRequest<LoginMutation, LoginMutationVariables>(LoginDocument),
      options
    );
export const GetAllUsersDocument = `
    query GetAllUsers {
  getAllUsers {
    ...userSnippet
  }
}
    ${UserSnippetFragmentDoc}`;
export const useGetAllUsersQuery = <
      TData = GetAllUsersQuery,
      TError = unknown
    >(
      variables?: GetAllUsersQueryVariables, 
      options?: UseQueryOptions<GetAllUsersQuery, TError, TData>
    ) => 
    useQuery<GetAllUsersQuery, TError, TData>(
      ['GetAllUsers', variables],
      useGQLRequest<GetAllUsersQuery, GetAllUsersQueryVariables>(GetAllUsersDocument).bind(null, variables),
      options
    );
export const MeDocument = `
    query Me {
  me {
    ...userSnippet
  }
}
    ${UserSnippetFragmentDoc}`;
export const useMeQuery = <
      TData = MeQuery,
      TError = unknown
    >(
      variables?: MeQueryVariables, 
      options?: UseQueryOptions<MeQuery, TError, TData>
    ) => 
    useQuery<MeQuery, TError, TData>(
      ['Me', variables],
      useGQLRequest<MeQuery, MeQueryVariables>(MeDocument).bind(null, variables),
      options
    );