import { InfiniteData, useInfiniteQuery } from 'react-query';
import { genericErrorMessage } from '../constants';
import { ThreadMessagesDocument, ThreadMessagesQuery } from '../generated/graphql';
import { graphqlClient } from './createGQLClient';
import { queryClient } from './createQueryClient';
import { errorToast } from './toasts';
import { removeDuplicateFragments } from './useGQLRequest';

export const messagesLimit = 30;

// const loaded: Array<string> = [];
export const usePaginatedMessagesQuery = (threadId: string) => {
  return useInfiniteQuery<ThreadMessagesQuery>(
    `ThreadMessages-${threadId}`,
    ({ pageParam = undefined }) => {
      const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
        `ThreadMessages-${threadId}`
      );

      // if (pages?.pageParams.includes(pageParam)) {
      // console.log('setting');
      // loaded.push(threadId);
      // }
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
        // if (loaded.includes(threadId)) {
        //   console.log('heyyyy');
        //   const firstPage = data.pages[0];
        //   const firstParams = data.pageParams[0];
        //   loaded.splice(loaded.indexOf(threadId), 1);
        //   return {
        //     pages: [firstPage],
        //     pageParams: [firstParams]
        //   };
        // }
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
