import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { isServer } from './isServer';

export default function withRedirect({ location }) {
  return (Component) => {
    const WithRedirectWrapper = (props) => {
      const router = useRouter();
      if (!isServer() && location) {
        console.log('client redirect: ', location);
        router.push(location);
        return null;
      }
      return <Component {...props} />;
    };

    WithRedirectWrapper.getInitialProps = async (context: NextPageContext) => {
      if (isServer() && context.res) {
        if (location) {
          console.log('server redirect: ', location);
          context.res.writeHead(302, { Location: location });
          context.res.end();
        }
      }

      const componentProps = await Component.getInitialProps?.(context);
      return { ...componentProps };
    };

    return WithRedirectWrapper;
  };
}
