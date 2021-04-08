import Link from 'next/link';

export interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  return (
    <div className="w-full h-16 bg-dark-300 border-b-2 border-accent flex flex-row items-center px-2">
      <Link href="/">
        <img src="/logo.gif" className="h-10 cursor-pointer select-none" />
      </Link>
    </div>
  );
};

export default Navbar;
