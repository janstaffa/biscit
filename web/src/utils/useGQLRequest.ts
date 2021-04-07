import { setLogger } from 'react-query';
import { graphqlClient } from './createGQLClient';

setLogger({
  log: () => {},
  warn: () => {},
  error: () => {},
});

export const useGQLRequest = <TData, TVariables>(
  query: string
): (() => Promise<TData>) => {
  return async (variables?: TVariables): Promise<TData> =>
    graphqlClient.request<TData, TVariables>(query, variables);
};
