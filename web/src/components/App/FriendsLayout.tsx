import Link from 'next/link';
import React, { ReactNode, useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { currentUrl } from '../../constants';
import ContentNav from './ContentNav';
import Layout from './Layout';

export interface FriendsLayoutProps {
  children: ReactNode;
}

const FriendsLayout: React.FC<FriendsLayoutProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>();

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  return (
    <Layout>
      <ContentNav>
        <div className="flex flex-row items-center h-full">
          <div className="border-r border-light-300 px-4 mr-2">
            <FaUserFriends className="text-light-300 text-2xl" />
          </div>
          <div className="text-light-200 font-roboto mx-2 px-3 hover:bg-dark-100 rounded-sm">
            <Link href="/app/friends/all">All</Link>
          </div>
          <div className="text-light-200 font-roboto mx-2 px-3 hover:bg-dark-100 rounded-sm">
            <Link href="/app/friends/online">Online</Link>
          </div>
          <div className="text-light-200 font-roboto mx-2 px-3 hover:bg-dark-100 rounded-sm">
            <Link href="/app/friends/pending">Pending</Link>
          </div>
          <div className="text-light-200 font-roboto mx-2 px-3 hover:bg-dark-100 rounded-sm">
            <Link href="/app/friends/add">Add friend</Link>
          </div>
        </div>
        <div>{children}</div>
      </ContentNav>
    </Layout>
  );
};

export default FriendsLayout;
