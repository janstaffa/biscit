import React from 'react';
import { Helmet } from 'react-helmet-async';
import AboutPage from '../components/Home/AboutPage';
import Footer from '../components/Home/Footer';
import LandingPage from '../components/Home/LandingPage';
export interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  return (
    <>
      <Helmet>
        <title>Biscit | Home</title>
      </Helmet>
      <LandingPage />
      <AboutPage />
      <Footer />
    </>
  );
};

export default Home;
