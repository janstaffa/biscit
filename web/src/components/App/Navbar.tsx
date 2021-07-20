import { useEffect, useState } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { Link } from 'react-router-dom';
import { isPhone } from '../../constants';

export interface NavbarProps {
  changeIsOpen: () => void;
}
const Navbar: React.FC<NavbarProps> = ({ changeIsOpen }) => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(isPhone);
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsSmallScreen(true);
        return;
      }
      setIsSmallScreen(false);
    };
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return (
    <div className="w-full h-14 bg-dark-300 border-b-2 border-accent flex flex-row items-center justify-between px-2 z-10">
      <Link to="/">
        <img src="/logo.gif" className="h-10 cursor-pointer select-none" />
      </Link>
      <div>
        {isPhone ||
          (isSmallScreen && (
            <GiHamburgerMenu
              size={30}
              className="text-light-300 cursor-pointer hover:text-light-400"
              onClick={changeIsOpen}
            />
          ))}
      </div>
    </div>
  );
};

export default Navbar;
