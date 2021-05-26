import { useInfiniteQuery } from 'react-query';
import { genericErrorMessage } from '../constants';
import { ThreadMessagesDocument, ThreadMessagesQuery } from '../generated/graphql';
import { graphqlClient } from './createGQLClient';
import { errorToast } from './toasts';
import { removeDuplicateFragments } from './useGQLRequest';

export const messagesLimit = 30;

export const usePaginatedMessagesQuery = (threadId: string) => {
  return useInfiniteQuery<ThreadMessagesQuery>(
    `ThreadMessages-${threadId}`,
    ({ pageParam = undefined }) => {
      const vars = {
        options: {
          threadId,
          cursor: pageParam,
          limit: messagesLimit
        }
      };
      return graphqlClient.request(removeDuplicateFragments(ThreadMessagesDocument), vars);
    },
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      },
      getNextPageParam: (lastPage) => lastPage.messages.nextMessage?.createdAt,
      enabled: false,
      select: (data) => ({
        pages: [...data.pages].reverse(),
        pageParams: [...data.pageParams].reverse()
      }),
      refetchOnMount: false,
      cacheTime: 7 * 24 * 3600 * 1000 // 7 days
    }
  );
};
