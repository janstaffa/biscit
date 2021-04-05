import Head from 'next/head';
import React from 'react';
import { FiArrowDownCircle } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';
import HomeNav from './Navbar';

export interface LandingPageProps {}

const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="w-screen h-screen bg-dark-300">
      <Head>
        <title>Biscit | Home</title>
        <link rel="icon" href="/logo_browser.gif" />
      </Head>
      <HomeNav />
      <div className="w-full h-auto bg-dark-300 flex flex-row justify-center items-center mt-10">
        <div className="w-full h-80">
          <p className="text-light text-3xl font-opensans font-bold text-center">
            Welcome to Biscit
          </p>
          <p className="text-light text-base font-opensans font-bold text-center">
            the open source chat
          </p>
          <div className="w-full flex flex-row flex-wrap justify-center mt-10">
            <button className="bg-accent hover:bg-accent-hover hover:shadow-md hover:text-dark-300 duration-75 px-5 py-2 rounded-full font-bold m-2 flex flex-row items-center">
              <HiOutlineDownload className="text-2xl mr-2" />
              Download the app
            </button>
            <button className="border-2 border-accent bg-dark-300 text-accent hover:border-accent-hover hover:text-accent-hover hover:bg-dark-200 hover:shadow-md px-5 duration-75 py-2 rounded-full font-bold m-2">
              Open in browser
            </button>
          </div>
          <div className="absolute bottom-20 w-full flex">
            <a href="#about" className="mx-auto">
              <FiArrowDownCircle className="text-7xl text-accent hover:text-accent-hover" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
