import React from 'react';
import AboutPage from '../components/Home/AboutPage';
import Footer from '../components/Home/Footer';
import LandingPage from '../components/Home/LandingPage';
const Home: React.FC = () => {
  return (
    <>
      <LandingPage />
      <AboutPage />
      <Footer />
    </>
  );
};

export default Home;
