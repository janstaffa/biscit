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
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any;
};

export type BooleanResponse = {
  __typename?: 'BooleanResponse';
  data: Scalars['Boolean'];
  errors: Array<GqlValidationError>;
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
  threadId: Scalars['String'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
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
  incoming: Array<FriendRequest>;
  outcoming: Array<FriendRequest>;
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

export type Message = {
  __typename?: 'Message';
  id: Scalars['String'];
  userId: Scalars['String'];
  user: User;
  threadId: Scalars['String'];
  content: Scalars['String'];
  edited: Scalars['Boolean'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  FriendRequestSend: BooleanResponse;
  FriendRequestAccept: BooleanResponse;
  FriendRemove: BooleanResponse;
  FriendRequestCancel: BooleanResponse;
  UserRegister: BooleanResponse;
  UserLogin: BooleanResponse;
  UserLogout: Scalars['Boolean'];
  UserUpdateStatus: Scalars['Boolean'];
};

export type MutationFriendRequestSendArgs = {
  options: FriendRequestInput;
};

export type MutationFriendRequestAcceptArgs = {
  options: RequestAcceptInput;
};

export type MutationFriendRemoveArgs = {
  options: FriendRemoveInput;
};

export type MutationFriendRequestCancelArgs = {
  options: RequestCancelInput;
};

export type MutationUserRegisterArgs = {
  options: RegisterInput;
};

export type MutationUserLoginArgs = {
  options: LoginInput;
};

export type MutationUserUpdateStatusArgs = {
  options: UpdateStatusInput;
};

export type Query = {
  __typename?: 'Query';
  thread: ThreadResponse;
  me?: Maybe<User>;
};

export type QueryThreadArgs = {
  options: ThreadQueryInput;
};

export type RegisterInput = {
  username: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  confirmPassword: Scalars['String'];
};

export type RequestAcceptInput = {
  requestId: Scalars['Float'];
  value: Scalars['Boolean'];
};

export type RequestCancelInput = {
  requestId: Scalars['Float'];
};

export type Thread = {
  __typename?: 'Thread';
  id: Scalars['String'];
  isDm: Scalars['Boolean'];
  name?: Maybe<Scalars['String']>;
  members: Array<ThreadMembers>;
  lastMessage?: Maybe<Scalars['String']>;
  lastActivity: Scalars['DateTime'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type ThreadMembers = {
  __typename?: 'ThreadMembers';
  id: Scalars['String'];
  threadId: Scalars['String'];
  thread: Thread;
  userId: Scalars['String'];
  user: User;
  isAdmin: Scalars['Boolean'];
  unread: Scalars['Float'];
  lastActivity: Scalars['DateTime'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type ThreadQueryInput = {
  threadId: Scalars['String'];
};

export type ThreadResponse = {
  __typename?: 'ThreadResponse';
  data?: Maybe<Thread>;
  errors: Array<GqlValidationError>;
};

export type UpdateStatusInput = {
  status: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  id: Scalars['String'];
  username: Scalars['String'];
  email: Scalars['String'];
  status: Scalars['String'];
  bio?: Maybe<Scalars['String']>;
  friends?: Maybe<Array<Friend>>;
  threads?: Maybe<Array<ThreadMembers>>;
  messages?: Maybe<Array<Message>>;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
  friend_requests: FriendRequestResponse;
};

export type ErrorSnippetFragment = { __typename?: 'GQLValidationError' } & Pick<GqlValidationError, 'name'> & {
    details?: Maybe<{ __typename?: 'DetailsType' } & Pick<DetailsType, 'field' | 'value' | 'message'>>;
  };

export type MessageSnippetFragment = { __typename?: 'Message' } & Pick<
  Message,
  'id' | 'content' | 'threadId' | 'userId' | 'edited' | 'createdAt' | 'updatedAt'
> & { user: { __typename?: 'User' } & UserSnippetFragment };

export type ThreadSnippetFragment = { __typename?: 'Thread' } & Pick<
  Thread,
  'id' | 'isDm' | 'name' | 'lastMessage' | 'lastActivity' | 'createdAt' | 'updatedAt'
> & { members: Array<{ __typename?: 'ThreadMembers' } & ThreadMembersSnippetFragment> };

export type ThreadMembersSnippetFragment = { __typename?: 'ThreadMembers' } & Pick<
  ThreadMembers,
  'id' | 'threadId' | 'userId' | 'isAdmin' | 'unread' | 'lastActivity' | 'createdAt' | 'updatedAt'
>;

export type UserSnippetFragment = { __typename?: 'User' } & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>;

export type AcceptRequestMutationVariables = Exact<{
  options: RequestAcceptInput;
}>;

export type AcceptRequestMutation = { __typename?: 'Mutation' } & {
  FriendRequestAccept: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

export type CancelRequestMutationVariables = Exact<{
  options: RequestCancelInput;
}>;

export type CancelRequestMutation = { __typename?: 'Mutation' } & {
  FriendRequestCancel: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

export type LoginMutationVariables = Exact<{
  options: LoginInput;
}>;

export type LoginMutation = { __typename?: 'Mutation' } & {
  UserLogin: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

export type LogoutMutationVariables = Exact<{ [key: string]: never }>;

export type LogoutMutation = { __typename?: 'Mutation' } & Pick<Mutation, 'UserLogout'>;

export type RegisterMutationVariables = Exact<{
  options: RegisterInput;
}>;

export type RegisterMutation = { __typename?: 'Mutation' } & {
  UserRegister: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

export type RemoveFriendMutationVariables = Exact<{
  options: FriendRemoveInput;
}>;

export type RemoveFriendMutation = { __typename?: 'Mutation' } & {
  FriendRemove: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

export type SendRequestMutationVariables = Exact<{
  options: FriendRequestInput;
}>;

export type SendRequestMutation = { __typename?: 'Mutation' } & {
  FriendRequestSend: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<
        { __typename?: 'GQLValidationError' } & Pick<GqlValidationError, 'name'> & {
            details?: Maybe<{ __typename?: 'DetailsType' } & Pick<DetailsType, 'field' | 'value' | 'message'>>;
          }
      >;
    };
};

export type UpdateStatusMutationVariables = Exact<{
  options: UpdateStatusInput;
}>;

export type UpdateStatusMutation = { __typename?: 'Mutation' } & Pick<Mutation, 'UserUpdateStatus'>;

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = { __typename?: 'Query' } & {
  me?: Maybe<
    { __typename?: 'User' } & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'> & {
        friend_requests: { __typename?: 'FriendRequestResponse' } & {
          incoming: Array<
            { __typename?: 'FriendRequest' } & Pick<FriendRequest, 'id' | 'createdAt'> & {
                sender: { __typename?: 'User' } & UserSnippetFragment;
              }
          >;
          outcoming: Array<
            { __typename?: 'FriendRequest' } & Pick<FriendRequest, 'id' | 'createdAt'> & {
                reciever: { __typename?: 'User' } & UserSnippetFragment;
              }
          >;
        };
        friends?: Maybe<
          Array<
            { __typename?: 'Friend' } & Pick<Friend, 'id' | 'key' | 'createdAt'> & {
                friend: { __typename?: 'User' } & UserSnippetFragment;
              }
          >
        >;
        threads?: Maybe<
          Array<
            { __typename?: 'ThreadMembers' } & Pick<ThreadMembers, 'isAdmin' | 'threadId' | 'unread'> & {
                thread: { __typename?: 'Thread' } & ThreadSnippetFragment;
              }
          >
        >;
      }
  >;
};

export type ThreadQueryVariables = Exact<{
  options: ThreadQueryInput;
}>;

export type ThreadQuery = { __typename?: 'Query' } & {
  thread: { __typename?: 'ThreadResponse' } & {
    data?: Maybe<
      { __typename?: 'Thread' } & Pick<Thread, 'id' | 'name' | 'lastActivity' | 'createdAt' | 'updatedAt'> & {
          members: Array<
            { __typename?: 'ThreadMembers' } & Pick<
              ThreadMembers,
              'id' | 'isAdmin' | 'unread' | 'lastActivity' | 'createdAt'
            > & { user: { __typename?: 'User' } & UserSnippetFragment }
          >;
        }
    >;
    errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
  };
};

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
export const MessageSnippetFragmentDoc = `
    fragment messageSnippet on Message {
  id
  content
  threadId
  userId
  user {
    ...userSnippet
  }
  edited
  createdAt
  updatedAt
}
    ${UserSnippetFragmentDoc}`;
export const ThreadMembersSnippetFragmentDoc = `
    fragment threadMembersSnippet on ThreadMembers {
  id
  threadId
  userId
  isAdmin
  unread
  lastActivity
  createdAt
  updatedAt
}
    `;
export const ThreadSnippetFragmentDoc = `
    fragment threadSnippet on Thread {
  id
  isDm
  name
  lastMessage
  members {
    ...threadMembersSnippet
  }
  lastActivity
  createdAt
  updatedAt
}
    ${ThreadMembersSnippetFragmentDoc}`;
export const AcceptRequestDocument = `
    mutation AcceptRequest($options: RequestAcceptInput!) {
  FriendRequestAccept(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useAcceptRequestMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<AcceptRequestMutation, TError, AcceptRequestMutationVariables, TContext>
) =>
  useMutation<AcceptRequestMutation, TError, AcceptRequestMutationVariables, TContext>(
    useGQLRequest<AcceptRequestMutation, AcceptRequestMutationVariables>(AcceptRequestDocument),
    options
  );
export const CancelRequestDocument = `
    mutation CancelRequest($options: RequestCancelInput!) {
  FriendRequestCancel(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useCancelRequestMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<CancelRequestMutation, TError, CancelRequestMutationVariables, TContext>
) =>
  useMutation<CancelRequestMutation, TError, CancelRequestMutationVariables, TContext>(
    useGQLRequest<CancelRequestMutation, CancelRequestMutationVariables>(CancelRequestDocument),
    options
  );
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
export const useLoginMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<LoginMutation, TError, LoginMutationVariables, TContext>
) =>
  useMutation<LoginMutation, TError, LoginMutationVariables, TContext>(
    useGQLRequest<LoginMutation, LoginMutationVariables>(LoginDocument),
    options
  );
export const LogoutDocument = `
    mutation Logout {
  UserLogout
}
    `;
export const useLogoutMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<LogoutMutation, TError, LogoutMutationVariables, TContext>
) =>
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
export const useRegisterMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<RegisterMutation, TError, RegisterMutationVariables, TContext>
) =>
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
export const useRemoveFriendMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<RemoveFriendMutation, TError, RemoveFriendMutationVariables, TContext>
) =>
  useMutation<RemoveFriendMutation, TError, RemoveFriendMutationVariables, TContext>(
    useGQLRequest<RemoveFriendMutation, RemoveFriendMutationVariables>(RemoveFriendDocument),
    options
  );
export const SendRequestDocument = `
    mutation SendRequest($options: FriendRequestInput!) {
  FriendRequestSend(options: $options) {
    data
    errors {
      name
      details {
        field
        value
        message
      }
    }
  }
}
    `;
export const useSendRequestMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<SendRequestMutation, TError, SendRequestMutationVariables, TContext>
) =>
  useMutation<SendRequestMutation, TError, SendRequestMutationVariables, TContext>(
    useGQLRequest<SendRequestMutation, SendRequestMutationVariables>(SendRequestDocument),
    options
  );
export const UpdateStatusDocument = `
    mutation UpdateStatus($options: UpdateStatusInput!) {
  UserUpdateStatus(options: $options)
}
    `;
export const useUpdateStatusMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<UpdateStatusMutation, TError, UpdateStatusMutationVariables, TContext>
) =>
  useMutation<UpdateStatusMutation, TError, UpdateStatusMutationVariables, TContext>(
    useGQLRequest<UpdateStatusMutation, UpdateStatusMutationVariables>(UpdateStatusDocument),
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
    threads {
      isAdmin
      threadId
      unread
      thread {
        ...threadSnippet
      }
    }
  }
}
    ${UserSnippetFragmentDoc}
${ThreadSnippetFragmentDoc}`;
export const useMeQuery = <TData = MeQuery, TError = unknown>(
  variables?: MeQueryVariables,
  options?: UseQueryOptions<MeQuery, TError, TData>
) =>
  useQuery<MeQuery, TError, TData>(
    ['Me', variables],
    useGQLRequest<MeQuery, MeQueryVariables>(MeDocument).bind(null, variables),
    options
  );
export const ThreadDocument = `
    query Thread($options: ThreadQueryInput!) {
  thread(options: $options) {
    data {
      id
      name
      lastActivity
      createdAt
      updatedAt
      members {
        id
        isAdmin
        unread
        lastActivity
        createdAt
        user {
          ...userSnippet
        }
      }
    }
    errors {
      ...errorSnippet
    }
  }
}
    ${UserSnippetFragmentDoc}
${ErrorSnippetFragmentDoc}`;
export const useThreadQuery = <TData = ThreadQuery, TError = unknown>(
  variables: ThreadQueryVariables,
  options?: UseQueryOptions<ThreadQuery, TError, TData>
) =>
  useQuery<ThreadQuery, TError, TData>(
    ['Thread', variables],
    useGQLRequest<ThreadQuery, ThreadQueryVariables>(ThreadDocument).bind(null, variables),
    options
  );
