import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode, useEffect, useState } from 'react';
type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  href?: string;
  active?: boolean;
};

const TabButton: React.FC<TabButtonProps> = ({
  children,
  onClick,
  href = '#',
  active: isActive = false,
}) => {
  const [active, setActive] = useState<boolean>(isActive);
  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  return (
    <div className="w-full h-14 flex flex-col justify-center items-center select-none">
      <Link href={href}>
        <button
          className={
            'w-full py-3 rounded-sm text-light-200 text-lg font-roboto flex flex-row place-items-center px-4' +
            (active ? ' bg-dark-50' : ' hover:bg-dark-100 hover:text-white')
          }
          onClick={(e) => onClick?.(e)}
        >
          {children}
        </button>
      </Link>
    </div>
  );
};

export default TabButton;
