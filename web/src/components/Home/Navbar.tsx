import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export interface HomeNavProps {}

const HomeNav: React.FC<HomeNavProps> = () => {
  const [isTop, setIsTop] = useState<boolean>(true);
  const handleScroll = () => {
    if (window.scrollY === 0) {
      setIsTop(true);
      return;
    }
    setIsTop(false);
  };
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={
        'flex flex-row items-center py-1 px-7 w-full fixed top-0 z-50 transition-all duration-200 bg-dark-300 ' +
        (isTop ? 'bg-opacity-0' : 'bg-opacity-75')
      }
    >
      <div className="flex-grow">
        <Link to="/">
          <img src="/logo.gif" alt="Biscit logo" width="130px" className="cursor-pointer" />
        </Link>
      </div>
      <div className="flex flex-row items-center">
        <a
          href="http://janstaffa.cz"
          target="_blank"
          className="text-light font-roboto mr-3 hover:text-accent duration-75"
          rel="noreferrer"
        >
          by janstaffa
        </a>
        <a
          href="https://github.com/janstaffa/biscit"
          target="_blank"
          className="text-light text-3xl hover:text-light-hover duration-75"
          rel="noreferrer"
        >
          <FaGithub />
        </a>
      </div>
    </nav>
  );
};

export default HomeNav;
