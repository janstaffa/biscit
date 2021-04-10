import cookie from 'cookie';
import App, { AppContext } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from 'react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '../providers/AuthProvider';
import '../styles/fonts.css';
import '../styles/globals.css';
const queryClient = new QueryClient();

toast.configure();

const _App = ({ Component, pageProps, authenticated }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authenticated={authenticated}>
        <Head>
          <link rel="icon" href="/logo_browser.gif" />
        </Head>
        <Component {...pageProps} />
        <ToastContainer />
      </AuthProvider>
    </QueryClientProvider>
  );
};

_App.getInitialProps = async (context: AppContext) => {
  let authenticated = false;
  const req = context.ctx.req;
  if (req && typeof req.headers.cookie === 'string') {
    const parsed = cookie.parse(req.headers.cookie);
    authenticated = !!parsed.uid;
  }

  const appProps = await App.getInitialProps(context);
  return { ...appProps, authenticated };
};

export default _App;
