import Link from 'next/link';
import { ReactNode } from 'react';
export interface NavLinkProps {
  children: ReactNode;
  href: string;
  active?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  children,
  href,
  active = false,
}) => {
  return (
    <Link href={href}>
      <div
        className={
          'text-light-200 font-roboto mx-2 px-3 rounded-sm cursor-pointer' +
          (active ? ' bg-dark-50' : ' hover:bg-dark-100')
        }
      >
        {children}
      </div>
    </Link>
  );
};

export default NavLink;
