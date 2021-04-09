import Cookies from 'js-cookie';
import Head from 'next/head';
import router from 'next/router';
import { useEffect } from 'react';
import Layout from '../../../components/App/Layout';
export interface AppProps {}

const Friends: React.FC<AppProps> = () => {
  useEffect(() => {
    const uid = Cookies.get('uid');
    if (!uid) router.replace('/login');
  }, []);

  return (
    <>
      <Head>
        <title>Biscit | Friends</title>
      </Head>
      <Layout>
        <div className="w-full h-full bg-red-400"></div>
      </Layout>
    </>
  );
};

export default Friends;
