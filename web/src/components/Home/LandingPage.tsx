import Link from 'next/link';
import React from 'react';
import { FiArrowDownCircle } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';
import HomeNav from './Navbar';
export interface LandingPageProps {}

const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <>
      <div className="w-screen h-screen">
        <HomeNav />
        <div className="w-full h-auto bg-transparent flex flex-row justify-center items-center mt-10">
          <div className="w-full h-80">
            <p className="text-light text-3xl font-opensans font-bold text-center">
              Welcome to Biscit
            </p>
            <p className="text-light text-base font-opensans font-bold text-center">
              the open source chat
            </p>
            <div className="w-full flex flex-row flex-wrap justify-center mt-10">
              <button className="bg-accent hover:bg-accent-hover hover:shadow-md hover:text-dark-300 duration-75 px-5 py-2 rounded-full font-bold m-2 flex flex-row items-center cursor-not-allowed">
                <HiOutlineDownload className="text-2xl mr-2" />
                Download the app
              </button>
              <Link href="/login">
                <a className="border-2 border-accent bg-dark-300 text-accent hover:border-accent-hover hover:text-accent-hover hover:bg-dark-200 hover:shadow-md px-5 duration-75 py-2 rounded-full font-bold m-2">
                  Open in browser
                </a>
              </Link>
            </div>
            <div className="absolute bottom-20 w-full flex">
              <div className="mx-auto">
                <FiArrowDownCircle
                  className="text-7xl text-accent hover:text-accent-hover cursor-pointer"
                  onClick={() => {
                    window &&
                      document.querySelector('#about')!.scrollIntoView();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 100"
        className="bg-dark-200"
      >
        <path
          fill="#0e1116"
          fillOpacity="1"
          d="M0,64L80,69.3C160,75,320,85,480,85.3C640,85,800,75,960,64C1120,53,1280,43,1360,37.3L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
        ></path>
      </svg>
    </>
  );
};

export default LandingPage;
