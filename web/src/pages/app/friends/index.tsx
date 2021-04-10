import Head from 'next/head';
import Layout from '../../../components/App/Layout';
import withAuth from '../../../utils/withAuth';
export interface AppProps {}

const Friends: React.FC<AppProps> = () => {
  return (
    <>
      <Head>
        <title>Biscit | Friends</title>
      </Head>
      <Layout>
        <div className="w-full h-full text-white">Hi, can you see me?</div>
      </Layout>
    </>
  );
};

export default withAuth(Friends);
