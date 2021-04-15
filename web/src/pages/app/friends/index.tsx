import { NextPage } from 'next';
import Head from 'next/head';
import FriendsLayout from '../../../components/App/FriendsLayout';
import withRedirect from '../../../utils/withRedirect';

const Friends: NextPage = () => {
  return (
    <>
      <Head>
        <title>Biscit | Friends</title>
      </Head>
      <FriendsLayout>
        <div></div>
      </FriendsLayout>
    </>
  );
};

export default withRedirect({ location: '/app/friends/all' })(Friends);
