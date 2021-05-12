import { useInfiniteQuery } from 'react-query';
import { genericErrorMessage } from '../constants';
import { ThreadMessagesDocument, ThreadMessagesQuery } from '../generated/graphql';
import { graphqlClient } from './createGQLClient';
import { errorToast } from './toasts';

export const messagesLimit = 30;

export const usePaginatedMessagesQuery = (threadId: string) => {
  return useInfiniteQuery<ThreadMessagesQuery>(
    `ThreadMessages-${threadId}`,
    ({ pageParam = null }) => {
      const vars = {
        options: {
          threadId,
          cursor: pageParam,
          limit: messagesLimit
        }
      };
      return graphqlClient.request(ThreadMessagesDocument, vars);
    },
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      },
      // getNextPageParam: (lastPage, pages) => {
      //   if (lastPage?.messages?.data) {
      //     console.log(lastPage, pages);
      //     return lastPage.messages.data[0].createdAt;
      //   }
      //   return null;
      // },
      enabled: false
    }
  );
};
