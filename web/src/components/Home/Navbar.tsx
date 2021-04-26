import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
export interface HomeNavProps {}

const HomeNav: React.FC<HomeNavProps> = () => {
  return (
    <nav className="flex flex-row items-center py-5 px-7 bg-transparent">
      <div className="flex-grow">
        <Link href="/">
          <img
            src="/logo.gif"
            alt="Biscit logo"
            width="130px"
            className="cursor-pointer"
          />
        </Link>
      </div>
      <div className="flex flex-row items-center">
        <a
          href="http://janstaffa.cz"
          target="_blank"
          className="text-light font-roboto mr-3 hover:text-accent duration-75" rel="noreferrer"
        >
          by janstaffa
        </a>
        <a
          href="https://github.com/janstaffa/biscit"
          target="_blank"
          className="text-light text-3xl hover:text-light-hover duration-75" rel="noreferrer"
        >
          <FaGithub />
        </a>
      </div>
    </nav>
  );
};

export default HomeNav;
