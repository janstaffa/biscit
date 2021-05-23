import { parse } from 'graphql';
import { print } from 'graphql/language/printer';
import { setLogger } from 'react-query';
import { graphqlClient } from './createGQLClient';

export const removeDuplicateFragments = (query: string): string => {
  const ast = parse(query);

  const seen: string[] = [];

  const newDefinitions = ast.definitions.filter((def) => {
    if (def.kind !== 'FragmentDefinition') {
      return true;
    }

    const id = `${def.name.value}-${def.typeCondition.name.value}`;
    const haveSeen = seen.includes(id);

    seen.push(id);

    return !haveSeen;
  });

  const newAst = {
    ...ast,
    definitions: newDefinitions
  };

  return print(newAst);
};
setLogger({
  log: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message)
});

export const useGQLRequest = <TData, TVariables>(query: string): (() => Promise<TData>) => {
  return async (variables?: TVariables): Promise<TData> =>
    graphqlClient.request<TData, TVariables>(removeDuplicateFragments(query), variables);
};
