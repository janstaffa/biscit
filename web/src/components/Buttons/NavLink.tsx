import Link from 'next/link';
import { InputHTMLAttributes, ReactNode } from 'react';
export type NavLinkProps = InputHTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  href: string;
  active?: boolean;
};

const NavLink: React.FC<NavLinkProps> = ({
  children,
  href,
  active = false,
  ...props
}) => {
  return (
    <Link href={href}>
      <div
        className={
          props.className
            ? ` ${props.className}`
            : 'text-light-200 font-bold mx-2 px-3 rounded-sm cursor-pointer' +
              (active ? ' bg-dark-50' : ' hover:bg-dark-100')
        }
        {...props}
      >
        {children}
      </div>
    </Link>
  );
};

export default NavLink;
