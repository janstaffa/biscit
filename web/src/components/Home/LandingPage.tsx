import * as PIXI from 'pixi.js';
import React, { useEffect, useRef } from 'react';
import { FiArrowDownCircle } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { randomNumber } from '../../utils/getRandomNumber';
import HomeNav from './Navbar';

export interface LandingPageProps {}
interface Biscuit {
  sprite: PIXI.Sprite;
  speed: number;
  rotation: number;
}
const LandingPage: React.FC<LandingPageProps> = () => {
  const background = useRef<HTMLDivElement | null>(null);
  const BISCUIT_SIZE = 50;
  const BISCUIT_COUNT = 20;
  useEffect(() => {
    const biscuits: Biscuit[] = [];
    if (!background.current) return;
    const pixiApp = new PIXI.Application({
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      resizeTo: background.current
    });

    background.current.appendChild(pixiApp.view);

    const container = new PIXI.Container();
    pixiApp.stage.addChild(container);

    const texture = PIXI.Texture.from('/logo_browser.gif');
    const regenerateSprites = () => {
      for (let i = 0; i < BISCUIT_COUNT; i++) {
        const biscuit = new PIXI.Sprite(texture);
        biscuit.width = BISCUIT_SIZE;
        biscuit.height = BISCUIT_SIZE;
        // biscuit.alpha = 0.3;

        const posX = randomNumber(BISCUIT_SIZE / 2, 1920 - BISCUIT_SIZE / 2);
        biscuit.x = posX;
        biscuit.y = -BISCUIT_SIZE;
        biscuit.anchor.set(0.5);
        const speed = randomNumber(2, 8);
        let rotation = randomNumber(1, 3);
        const isReversed = randomNumber(0, 1);
        if (isReversed === 1) {
          rotation = -rotation;
        }
        biscuits.push({ sprite: biscuit, speed, rotation });
        container.addChild(biscuit);
      }
      console.log(biscuits.length);
    };
    regenerateSprites();
    setInterval(regenerateSprites, 500);
    const resizeHandler = () => {
      if (!background.current) return;
      const scaleFactor = background.current.clientWidth / 1920;
      if (scaleFactor < 1) return;
      container.scale.set(scaleFactor);
    };

    window.addEventListener('resize', resizeHandler, false);

    pixiApp.ticker.add((delta) => {
      biscuits.forEach((biscuit, idx) => {
        biscuit.sprite.rotation -= (biscuit.rotation / 100) * delta;

        const newY = biscuit.sprite.y + biscuit.speed * delta;
        biscuit.sprite.y = newY;

        if (newY > background.current!.clientHeight) {
          container.removeChild(biscuit.sprite);
          biscuits.splice(idx, 1);
        }
      });
    });
  }, []);
  return (
    <>
      <div
        className="absolute top-0 left-0 w-full opacity-30 bg-dark-300"
        ref={background}
        style={{ zIndex: -10, height: 'calc(100% + 500px)' }}
      ></div>
      <div className="w-screen h-screen z-10">
        <HomeNav />
        <div className="w-full h-auto bg-transparent flex flex-row justify-center items-center mt-10">
          <div className="w-full h-80">
            <p className="text-light text-3xl font-opensans font-bold text-center">Welcome to Biscit</p>
            <p className="text-light text-base font-opensans font-bold text-center">the open source chat</p>
            <div className="w-full flex flex-row flex-wrap justify-center mt-10">
              <button className="bg-accent hover:bg-accent-hover hover:shadow-md hover:text-dark-300 duration-75 px-5 py-2 rounded-full font-bold m-2 flex flex-row items-center cursor-not-allowed">
                <HiOutlineDownload className="text-2xl mr-2" />
                Download the app
              </button>
              <Link to="/login" className="flex">
                <span className="border-2 border-accent bg-dark-300 text-accent hover:border-accent-hover hover:text-accent-hover hover:bg-dark-200 hover:shadow-md px-5 duration-75 py-2 rounded-full font-bold m-2">
                  Open in browser
                </span>
              </Link>
            </div>
            <div className="absolute bottom-20 w-full flex">
              <div className="mx-auto">
                <FiArrowDownCircle
                  className="text-7xl text-accent hover:text-accent-hover cursor-pointer"
                  onClick={() => {
                    document.querySelector('#about')!.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
