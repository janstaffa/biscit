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

export type DeleteMessageMutationInput = {
  messageId: Scalars['String'];
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
  replyingToId?: Maybe<Scalars['String']>;
  replyingTo?: Maybe<Message>;
  replies?: Maybe<Array<Message>>;
  resendId?: Maybe<Scalars['String']>;
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  FriendRequestSend: BooleanResponse;
  FriendRequestAccept: BooleanResponse;
  FriendRemove: BooleanResponse;
  FriendRequestCancel: BooleanResponse;
  DeleteMessage: BooleanResponse;
  UpdateMessage: BooleanResponse;
  ReadMessages: BooleanResponse;
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

export type MutationDeleteMessageArgs = {
  options: DeleteMessageMutationInput;
};

export type MutationUpdateMessageArgs = {
  options: UpdateMessageMutationInput;
};

export type MutationReadMessagesArgs = {
  options: ThreadInput;
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
  messages: ThreadMessagesResponse;
  thread: ThreadResponse;
  threads: Array<ThreadMembers>;
  me?: Maybe<User>;
  token?: Maybe<Scalars['String']>;
};

export type QueryMessagesArgs = {
  options: ThreadMessagesQueryInput;
};

export type QueryThreadArgs = {
  options: ThreadInput;
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
  lastMessage?: Maybe<Message>;
  lastActivity: Scalars['DateTime'];
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type ThreadInput = {
  threadId: Scalars['String'];
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

export type ThreadMessagesQueryInput = {
  threadId: Scalars['String'];
  cursor?: Maybe<Scalars['String']>;
  limit: Scalars['Float'];
};

export type ThreadMessagesResponse = {
  __typename?: 'ThreadMessagesResponse';
  data?: Maybe<Array<Message>>;
  nextMessage?: Maybe<Message>;
  errors: Array<GqlValidationError>;
};

export type ThreadResponse = {
  __typename?: 'ThreadResponse';
  data?: Maybe<Thread>;
  errors: Array<GqlValidationError>;
};

export type UpdateMessageMutationInput = {
  messageId: Scalars['String'];
  newContent: Scalars['String'];
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
  createdAt: Scalars['String'];
  updatedAt: Scalars['String'];
  friend_requests: FriendRequestResponse;
};

export type ErrorSnippetFragment = { __typename?: 'GQLValidationError' } & Pick<GqlValidationError, 'name'> & {
    details?: Maybe<{ __typename?: 'DetailsType' } & Pick<DetailsType, 'field' | 'value' | 'message'>>;
  };

export type MessageSnippetFragment = { __typename?: 'Message' } & Pick<
  Message,
  'id' | 'content' | 'threadId' | 'userId' | 'edited' | 'replyingToId' | 'resendId' | 'createdAt' | 'updatedAt'
> & {
    user: { __typename?: 'User' } & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>;
    replyingTo?: Maybe<
      { __typename?: 'Message' } & Pick<
        Message,
        'id' | 'content' | 'threadId' | 'userId' | 'createdAt' | 'updatedAt'
      > & { user: { __typename?: 'User' } & Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'> }
    >;
  };

export type ThreadSnippetFragment = { __typename?: 'Thread' } & Pick<
  Thread,
  'id' | 'isDm' | 'name' | 'lastActivity' | 'createdAt' | 'updatedAt'
> & {
    lastMessage?: Maybe<{ __typename?: 'Message' } & MessageSnippetFragment>;
    members: Array<{ __typename?: 'ThreadMembers' } & ThreadMembersSnippetFragment>;
  };

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

export type DeleteMessageMutationVariables = Exact<{
  options: DeleteMessageMutationInput;
}>;

export type DeleteMessageMutation = { __typename?: 'Mutation' } & {
  DeleteMessage: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
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

export type ReadMessagesMutationVariables = Exact<{
  options: ThreadInput;
}>;

export type ReadMessagesMutation = { __typename?: 'Mutation' } & {
  ReadMessages: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
    };
};

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

export type UpdateMessageMutationVariables = Exact<{
  options: UpdateMessageMutationInput;
}>;

export type UpdateMessageMutation = { __typename?: 'Mutation' } & {
  UpdateMessage: { __typename?: 'BooleanResponse' } & Pick<BooleanResponse, 'data'> & {
      errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
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
            { __typename?: 'Friend' } & Pick<Friend, 'id' | 'key' | 'threadId' | 'createdAt'> & {
                friend: { __typename?: 'User' } & UserSnippetFragment;
              }
          >
        >;
      }
  >;
};

export type ThreadMessagesQueryVariables = Exact<{
  options: ThreadMessagesQueryInput;
}>;

export type ThreadMessagesQuery = { __typename?: 'Query' } & {
  messages: { __typename?: 'ThreadMessagesResponse' } & {
    data?: Maybe<Array<{ __typename?: 'Message' } & MessageSnippetFragment>>;
    nextMessage?: Maybe<{ __typename?: 'Message' } & MessageSnippetFragment>;
    errors: Array<{ __typename?: 'GQLValidationError' } & ErrorSnippetFragment>;
  };
};

export type ThreadQueryVariables = Exact<{
  options: ThreadInput;
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

export type ThreadsQueryVariables = Exact<{ [key: string]: never }>;

export type ThreadsQuery = { __typename?: 'Query' } & {
  threads: Array<
    { __typename?: 'ThreadMembers' } & Pick<ThreadMembers, 'isAdmin' | 'threadId' | 'unread'> & {
        thread: { __typename?: 'Thread' } & ThreadSnippetFragment;
      }
  >;
};

export type TokenQueryVariables = Exact<{ [key: string]: never }>;

export type TokenQuery = { __typename?: 'Query' } & Pick<Query, 'token'>;

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
export const MessageSnippetFragmentDoc = `
    fragment messageSnippet on Message {
  id
  content
  threadId
  userId
  user {
    id
    username
    email
    status
    bio
  }
  edited
  replyingToId
  replyingTo {
    id
    content
    threadId
    userId
    user {
      id
      username
      email
      status
      bio
    }
    createdAt
    updatedAt
  }
  resendId
  createdAt
  updatedAt
}
    `;
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
  lastMessage {
    ...messageSnippet
  }
  members {
    ...threadMembersSnippet
  }
  lastActivity
  createdAt
  updatedAt
}
    ${MessageSnippetFragmentDoc}
${ThreadMembersSnippetFragmentDoc}`;
export const UserSnippetFragmentDoc = `
    fragment userSnippet on User {
  id
  username
  email
  status
  bio
}
    `;
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
export const DeleteMessageDocument = `
    mutation DeleteMessage($options: DeleteMessageMutationInput!) {
  DeleteMessage(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useDeleteMessageMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<DeleteMessageMutation, TError, DeleteMessageMutationVariables, TContext>
) =>
  useMutation<DeleteMessageMutation, TError, DeleteMessageMutationVariables, TContext>(
    useGQLRequest<DeleteMessageMutation, DeleteMessageMutationVariables>(DeleteMessageDocument),
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
export const ReadMessagesDocument = `
    mutation ReadMessages($options: ThreadInput!) {
  ReadMessages(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useReadMessagesMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<ReadMessagesMutation, TError, ReadMessagesMutationVariables, TContext>
) =>
  useMutation<ReadMessagesMutation, TError, ReadMessagesMutationVariables, TContext>(
    useGQLRequest<ReadMessagesMutation, ReadMessagesMutationVariables>(ReadMessagesDocument),
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
export const UpdateMessageDocument = `
    mutation UpdateMessage($options: UpdateMessageMutationInput!) {
  UpdateMessage(options: $options) {
    data
    errors {
      ...errorSnippet
    }
  }
}
    ${ErrorSnippetFragmentDoc}`;
export const useUpdateMessageMutation = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<UpdateMessageMutation, TError, UpdateMessageMutationVariables, TContext>
) =>
  useMutation<UpdateMessageMutation, TError, UpdateMessageMutationVariables, TContext>(
    useGQLRequest<UpdateMessageMutation, UpdateMessageMutationVariables>(UpdateMessageDocument),
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
      threadId
      friend {
        ...userSnippet
      }
      createdAt
    }
  }
}
    ${UserSnippetFragmentDoc}`;
export const useMeQuery = <TData = MeQuery, TError = unknown>(
  variables?: MeQueryVariables,
  options?: UseQueryOptions<MeQuery, TError, TData>
) =>
  useQuery<MeQuery, TError, TData>(
    ['Me', variables],
    useGQLRequest<MeQuery, MeQueryVariables>(MeDocument).bind(null, variables),
    options
  );
export const ThreadMessagesDocument = `
    query ThreadMessages($options: ThreadMessagesQueryInput!) {
  messages(options: $options) {
    data {
      ...messageSnippet
    }
    nextMessage {
      ...messageSnippet
    }
    errors {
      ...errorSnippet
    }
  }
}
    ${MessageSnippetFragmentDoc}
${ErrorSnippetFragmentDoc}`;
export const useThreadMessagesQuery = <TData = ThreadMessagesQuery, TError = unknown>(
  variables: ThreadMessagesQueryVariables,
  options?: UseQueryOptions<ThreadMessagesQuery, TError, TData>
) =>
  useQuery<ThreadMessagesQuery, TError, TData>(
    ['ThreadMessages', variables],
    useGQLRequest<ThreadMessagesQuery, ThreadMessagesQueryVariables>(ThreadMessagesDocument).bind(null, variables),
    options
  );
export const ThreadDocument = `
    query Thread($options: ThreadInput!) {
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
export const ThreadsDocument = `
    query Threads {
  threads {
    isAdmin
    threadId
    unread
    thread {
      ...threadSnippet
    }
  }
}
    ${ThreadSnippetFragmentDoc}`;
export const useThreadsQuery = <TData = ThreadsQuery, TError = unknown>(
  variables?: ThreadsQueryVariables,
  options?: UseQueryOptions<ThreadsQuery, TError, TData>
) =>
  useQuery<ThreadsQuery, TError, TData>(
    ['Threads', variables],
    useGQLRequest<ThreadsQuery, ThreadsQueryVariables>(ThreadsDocument).bind(null, variables),
    options
  );
export const TokenDocument = `
    query Token {
  token
}
    `;
export const useTokenQuery = <TData = TokenQuery, TError = unknown>(
  variables?: TokenQueryVariables,
  options?: UseQueryOptions<TokenQuery, TError, TData>
) =>
  useQuery<TokenQuery, TError, TData>(
    ['Token', variables],
    useGQLRequest<TokenQuery, TokenQueryVariables>(TokenDocument).bind(null, variables),
    options
  );
