import { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../../components/App/Layout';
import withAuth from '../../utils/withAuth';
export interface AppProps {}

const App: NextPage<AppProps> = () => {
  return (
    <>
      <Head>
        <title>Biscit | App</title>
      </Head>
      <Layout>
        <div className="text-red-600">This should be visible now</div>
      </Layout>
    </>
  );
};

export default withAuth(App);
