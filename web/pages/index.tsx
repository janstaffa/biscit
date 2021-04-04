import Head from 'next/head';
import React from 'react';
import { FaGithub } from 'react-icons/fa';
import styles from '../styles/modules/Home.module.scss';
const Home: React.FC = () => {
  return (
    <div className={styles.page}>
      <Head>
        <title>Biscit | Home</title>
        <link rel="icon" href="/logo_browser.gif" />
      </Head>
      <nav>
        <div>
          <img src="/logo.gif" alt="Biscit logo" className={styles.logo} />
        </div>
        <div className={styles.rightDiv}>
          <div className="small-text text-light">
            by{' '}
            <a
              href="http://janstaffa.cz"
              className="small-text text-light"
              target="_blank"
            >
              janstaffa
            </a>
          </div>
          <a
            href="https://github.com/janstaffa/biscit"
            target="_blank"
            className="fy"
          >
            <FaGithub className={styles.icon} />
          </a>
        </div>
      </nav>
      <div className={styles.main}>
        <div className={styles.container}>
          <p className="text">
            hello<a>bye</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
