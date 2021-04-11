import cookie from 'cookie';
import { NextPageContext } from 'next';
import { useAuthStore } from '../stores/useAuthStore';
import withConditionalRedirect from './withConditionalRedirect';

export default function withNoAuth(Component, location = '/app/friends') {
  return withConditionalRedirect({
    Component,
    location,
    clientCondition: () => {
      const { authenticated } = useAuthStore();
      return authenticated;
    },
    serverCondition: (context: NextPageContext) => {
      const req = context.req;
      let authenticated = false;
      if (req && typeof req.headers.cookie === 'string') {
        const parsed = cookie.parse(req.headers.cookie);
        authenticated = !!parsed.uid;
      }
      return authenticated;
    },
  });
}
