export interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="w-full h-12 bg-dark-300 border-t-4 border-accent">
      <div className="mt-2">
        <p className="text-light-300 text-center">Copiright &copy; {new Date().getFullYear()} | Biscit</p>
      </div>
    </footer>
  );
};

export default Footer;
