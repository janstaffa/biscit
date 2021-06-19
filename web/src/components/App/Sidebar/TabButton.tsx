import { AnchorHTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type TabButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href?: string;
  active?: boolean;
};

const TabButton: React.FC<TabButtonProps> = ({ children, onClick, href = '#', active: isActive = false }) => {
  const [active, setActive] = useState<boolean>(isActive);
  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  return (
    <Link to={href} onClick={(e) => onClick?.(e)}>
      <div className="w-full h-14 flex flex-col justify-center items-center select-none">
        <button
          className={
            'w-full py-3 rounded-sm text-light-200 text-lg font-roboto flex flex-row place-items-center px-4' +
            (active ? ' bg-dark-50' : ' hover:bg-dark-100 hover:text-white')
          }
        >
          {children}
        </button>
      </div>
    </Link>
  );
};

export default TabButton;
