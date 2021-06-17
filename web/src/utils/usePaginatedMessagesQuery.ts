import { InfiniteData, useInfiniteQuery } from 'react-query';
import { ThreadMessagesDocument, ThreadMessagesQuery } from '../generated/graphql';
import { graphqlClient } from './createGQLClient';
import { queryClient } from './createQueryClient';
import { removeDuplicateFragments } from './useGQLRequest';

export const messagesLimit = 30;

export const usePaginatedMessagesQuery = (threadId: string) => {
  return useInfiniteQuery<ThreadMessagesQuery>(
    `ThreadMessages-${threadId}`,
    ({ pageParam = undefined }) => {
      const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
        `ThreadMessages-${threadId}`
      );

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
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.messages.data) {
          const nextMessage = lastPage.messages.data[0];
          if (nextMessage) {
            return nextMessage.createdAt;
          }
        }
        return undefined;
      },
      select: (data) => {
        return {
          pages: [...data.pages].reverse(),
          pageParams: [...data.pageParams].reverse()
        };
      },
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: 24 * 3600 * 1000 // 1 day
    }
  );
};
