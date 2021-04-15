import { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import AboutPage from '../components/Home/AboutPage';
import Footer from '../components/Home/Footer';
import LandingPage from '../components/Home/LandingPage';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Biscit | Home</title>
      </Head>
      <LandingPage />
      <AboutPage />
      <Footer />
    </>
  );
};

export default Home;
