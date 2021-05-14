import cookie from 'cookie';
import { NextPageContext } from 'next';
import { useIsAuthenticated } from '../providers/AuthProvider';
import withConditionalRedirect from './withConditionalRedirect';

export default function withAuth(Component, location = '/login') {
  return withConditionalRedirect({
    Component,
    location,
    clientCondition: () => {
      const authenticated = useIsAuthenticated();
      return !authenticated;
    },
    serverCondition: (context: NextPageContext) => {
      const req = context.req;
      let authenticated = false;
      if (req && typeof req.headers.cookie === 'string') {
        const parsed = cookie.parse(req.headers.cookie);
        authenticated = !!parsed.uid;
      }
      return !authenticated;
    }
  });
}
