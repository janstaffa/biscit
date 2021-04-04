import Head from 'next/head';
import React from 'react';
import styles from '../styles/modules/Home.module.scss';

const Home: React.FC = () => {
  return (
    <div className={styles.page}>
      <Head>
        <title>Biscit | Home</title>
        <link rel="icon" href="../../assets/logo_browser.gif" />
      </Head>
      <h1 className="container mx-auto px-4 bg-green-500">
        Welcome to Biscit!
      </h1>
    </div>
  );
};

export default Home;
