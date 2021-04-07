import Head from 'next/head';
import React from 'react';
import AboutPage from '../components/Home/AboutPage';
import Footer from '../components/Home/Footer';
import LandingPage from '../components/Home/LandingPage';
import { useGetAllUsersQuery } from '../generated/graphql';
import { graphqlClient } from '../utils/createGQLClient';

const Home: React.FC = () => {
  // const { data } = useMeQuery(graphqlClient);
  const { data } = useGetAllUsersQuery(graphqlClient);
  if (data) console.log(data);

  return (
    <>
      <Head>
        <title>Biscit | Home</title>
        <link rel="icon" href="/logo_browser.gif" />
      </Head>
      <LandingPage />
      <AboutPage />
      <Footer />
    </>
  );
};

export default Home;
