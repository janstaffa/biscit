import { setLogger } from 'react-query';
import { graphqlClient } from './createGQLClient';

setLogger({
  log: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message)
});

export const useGQLRequest = <TData, TVariables>(query: string): (() => Promise<TData>) => {
  return async (variables?: TVariables): Promise<TData> => graphqlClient.request<TData, TVariables>(query, variables);
};
