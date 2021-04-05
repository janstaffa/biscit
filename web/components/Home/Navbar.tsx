export interface HomeNavProps {}
import { FaGithub } from 'react-icons/fa';

const HomeNav: React.FC<HomeNavProps> = () => {
  return (
    <nav className="flex flex-row items-center py-5 px-7 bg-dark-300">
      <div className="flex-grow">
        <img src="/logo.gif" alt="Biscit logo" width="130px" />
      </div>
      <div className="flex flex-row items-center">
        <a
          href="http://janstaffa.cz"
          target="_blank"
          className="text-light font-roboto mr-3 hover:text-accent duration-75"
        >
          by janstaffa
        </a>
        <a
          href="https://github.com/janstaffa/biscit"
          target="_blank"
          className="text-light text-3xl hover:text-light-hover duration-75"
        >
          <FaGithub />
        </a>
      </div>
    </nav>
  );
};

export default HomeNav;
