import { GraphQLClient } from 'graphql-request';
import { gqlEndpoint } from '../constants';

export const graphQLClient = new GraphQLClient(gqlEndpoint);
