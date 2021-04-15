import { ReactNode } from 'react';

export interface ContentNavProps {
  children: ReactNode;
}

const ContentNav: React.FC<ContentNavProps> = ({ children }) => {
  return (
    <div className="w-full h-12 bg-dark-200 border-b-2 border-dark-50 absolute z-10">
      {children}
    </div>
  );
};

export default ContentNav;
