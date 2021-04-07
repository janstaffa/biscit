import { graphqlClient } from './createGQLClient';

export const useGQLFetch = <TData, TVariables>(
  query: string
): (() => Promise<TData>) => {
  return async (variables?: TVariables): Promise<TData> =>
    graphqlClient.request<TData, TVariables>(query, variables);
};
