import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <div className="w-full h-14 bg-dark-300 border-b-2 border-accent flex flex-row items-center px-2 z-10">
      <Link href="/">
        <img src="/logo.gif" className="h-10 cursor-pointer select-none" />
      </Link>
    </div>
  );
};

export default Navbar;
