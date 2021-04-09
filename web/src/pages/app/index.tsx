import Cookies from 'js-cookie';
import Head from 'next/head';
import router from 'next/router';
import { useEffect } from 'react';
import Layout from '../../components/App/Layout';
export interface AppProps {}

const App: React.FC<AppProps> = () => {
  useEffect(() => {
    const uid = Cookies.get('uid');
    if (!uid) router.replace('/login');
  }, []);

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

export default App;
