import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../../components/App/Layout';
import withRedirect from '../../utils/withRedirect';
export interface AppProps {}

const App: NextPage<AppProps> = () => {
  return (
    <>
      <Head>
        <title>Biscit | App</title>
      </Head>
      <Layout>
        <div></div>
      </Layout>
    </>
  );
};

export default withRedirect({ location: '/app/friends/all' })(App);
