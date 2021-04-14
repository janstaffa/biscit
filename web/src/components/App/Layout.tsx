import React, { ReactNode } from 'react';
import LeftSidebar from './LeftSidebar';
import Navbar from './Navbar';
interface LayoutProps {
  children: ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <div className="bg-dark-100 flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-row flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1">{children}</div>
          {/* <div className="h-full w-96"></div> */}
        </div>
      </div>
    </div>
  );
};

export default Layout;
