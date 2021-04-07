import { GraphQLClient } from 'graphql-request';
import { gqlEndpoint } from '../constants';

export const graphqlClient = new GraphQLClient(gqlEndpoint);
