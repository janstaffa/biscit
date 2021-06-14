import cookie from 'cookie';
import App, { AppContext } from 'next/app';
import Head from 'next/head';
import React, { useEffect } from 'react';
import { QueryClientProvider } from 'react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppWrap from '../components/AppWrap';
import { AuthProvider } from '../providers/AuthProvider';
import { useAuthStore } from '../stores/useAuthStore';
import '../styles/fonts.css';
import '../styles/globals.css';
import { queryClient } from '../utils/createQueryClient';
import { socket } from '../utils/createWSconnection';
import GetToken from '../utils/GetToken';
toast.configure();

const _App = ({ Component, pageProps, authenticated }) => {
  const { setAuthenticated } = useAuthStore();

  useEffect(() => {
    setAuthenticated(authenticated);
  }, []);

  useEffect(() => {
    socket.connect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authenticated={authenticated}>
        <GetToken />
        <AppWrap>
          <Head>
            <link rel="icon" href="/logo_browser.gif" />
          </Head>
          <Component {...pageProps} />
          <ToastContainer />
        </AppWrap>
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
