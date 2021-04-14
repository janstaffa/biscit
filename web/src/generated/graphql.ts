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

export type BooleanResponse = {
  __typename?: 'BooleanResponse';
  data: Scalars['Boolean'];
  errors?: Maybe<Array<GqlValidationError>>;
};

export type DetailsType = {
  __typename?: 'DetailsType';
  field?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type Friend = {
  __typename?: 'Friend';
  id: Scalars['String'];
  key: Scalars['String'];
  userId: Scalars['String'];
  user: User;
  friendId: Scalars['String'];
  friend: User;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type FriendAcceptInput = {
  requestId: Scalars['Float'];
};

export type FriendRemoveInput = {
  friendId: Scalars['String'];
};

export type FriendRequest = {
  __typename?: 'FriendRequest';
  id: Scalars['Float'];
  senderId: Scalars['String'];
  sender: User;
  recieverId: Scalars['String'];
  reciever: User;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type FriendRequestInput = {
  username: Scalars['String'];
};

export type FriendRequestResponse = {
  __typename?: 'FriendRequestResponse';
  incoming?: Maybe<Array<FriendRequest>>;
  outcoming?: Maybe<Array<FriendRequest>>;
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

export type Mutation = {
  __typename?: 'Mutation';
  FriendRequestSend: BooleanResponse;
  FriendRequestAccept: BooleanResponse;
  FriendRemove: BooleanResponse;
  UserRegister: BooleanResponse;
  UserLogin: BooleanResponse;
  UserLogout: Scalars['Boolean'];
};


export type MutationFriendRequestSendArgs = {
  options: FriendRequestInput;
};


export type MutationFriendRequestAcceptArgs = {
  options: FriendAcceptInput;
};


export type MutationFriendRemoveArgs = {
  options: FriendRemoveInput;
};


export type MutationUserRegisterArgs = {
  options: RegisterInput;
};


export type MutationUserLoginArgs = {
  options: LoginInput;
};

export type Query = {
  __typename?: 'Query';
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
  friends?: Maybe<Array<Friend>>;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
  friend_requests: FriendRequestResponse;
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
    { __typename?: 'BooleanResponse' }
    & Pick<BooleanResponse, 'data'>
    & { errors?: Maybe<Array<(
      { __typename?: 'GQLValidationError' }
      & ErrorSnippetFragment
    )>> }
  ) }
);

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = (
  { __typename?: 'Mutation' }
  & Pick<Mutation, 'UserLogout'>
);

export type RegisterMutationVariables = Exact<{
  options: RegisterInput;
}>;


export type RegisterMutation = (
  { __typename?: 'Mutation' }
  & { UserRegister: (
    { __typename?: 'BooleanResponse' }
    & Pick<BooleanResponse, 'data'>
    & { errors?: Maybe<Array<(
      { __typename?: 'GQLValidationError' }
      & ErrorSnippetFragment
    )>> }
  ) }
);

export type RemoveFriendMutationVariables = Exact<{
  options: FriendRemoveInput;
}>;


export type RemoveFriendMutation = (
  { __typename?: 'Mutation' }
  & { FriendRemove: (
    { __typename?: 'BooleanResponse' }
    & Pick<BooleanResponse, 'data'>
    & { errors?: Maybe<Array<(
      { __typename?: 'GQLValidationError' }
      & ErrorSnippetFragment
    )>> }
  ) }
);

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = (
  { __typename?: 'Query' }
  & { me?: Maybe<(
    { __typename?: 'User' }
    & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>
    & { friend_requests: (
      { __typename?: 'FriendRequestResponse' }
      & { incoming?: Maybe<Array<(
        { __typename?: 'FriendRequest' }
        & Pick<FriendRequest, 'id' | 'createdAt'>
        & { sender: (
          { __typename?: 'User' }
          & UserSnippetFragment
        ) }
      )>>, outcoming?: Maybe<Array<(
        { __typename?: 'FriendRequest' }
        & Pick<FriendRequest, 'id' | 'createdAt'>
        & { reciever: (
          { __typename?: 'User' }
          & UserSnippetFragment
        ) }
      )>> }
    ), friends?: Maybe<Array<(
      { __typename?: 'Friend' }
      & Pick<Friend, 'id' | 'key' | 'createdAt'>
      & { friend: (
        { __typename?: 'User' }
        & UserSnippetFragment
      ) }
    )>> }
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
export const LogoutDocument = `
    mutation Logout {
  UserLogout
}
    `;
export const useLogoutMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<LogoutMutation, TError, LogoutMutationVariables, TContext>) => 
    useMutation<LogoutMutation, TError, LogoutMutationVariables, TContext>(
      useGQLRequest<LogoutMutation, LogoutMutationVariables>(LogoutDocument),
      options
    );
export const RegisterDocument = `
    mutation Register($options: RegisterInput!) {
  UserRegister(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useRegisterMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<RegisterMutation, TError, RegisterMutationVariables, TContext>) => 
    useMutation<RegisterMutation, TError, RegisterMutationVariables, TContext>(
      useGQLRequest<RegisterMutation, RegisterMutationVariables>(RegisterDocument),
      options
    );
export const RemoveFriendDocument = `
    mutation RemoveFriend($options: FriendRemoveInput!) {
  FriendRemove(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useRemoveFriendMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<RemoveFriendMutation, TError, RemoveFriendMutationVariables, TContext>) => 
    useMutation<RemoveFriendMutation, TError, RemoveFriendMutationVariables, TContext>(
      useGQLRequest<RemoveFriendMutation, RemoveFriendMutationVariables>(RemoveFriendDocument),
      options
    );
export const MeDocument = `
    query Me {
  me {
    id
    username
    email
    status
    bio
    friend_requests {
      incoming {
        id
        sender {
          ...userSnippet
        }
        createdAt
      }
      outcoming {
        id
        reciever {
          ...userSnippet
        }
        createdAt
      }
    }
    friends {
      id
      key
      friend {
        ...userSnippet
      }
      createdAt
    }
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