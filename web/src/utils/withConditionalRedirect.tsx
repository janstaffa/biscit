import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { isServer } from './isServer';

export default function withConditionalRedirect({
  Component,
  location,
  clientCondition,
  serverCondition,
}) {
  const WithConditionalRedirectWrapper = (props) => {
    const router = useRouter();
    const redirectCondition = clientCondition();
    if (!isServer() && redirectCondition) {
      router.push(location);
      return null;
    }
    return <Component {...props} />;
  };

  WithConditionalRedirectWrapper.getInitialProps = async (
    context: NextPageContext
  ) => {
    if (isServer() && context.res) {
      if (serverCondition(context)) {
        context.res.writeHead(302, { Location: location });
        context.res.end();
      }
    }

    const componentProps = await Component.getInitialProps?.(context);

    return { ...componentProps };
  };

  return WithConditionalRedirectWrapper;
}
