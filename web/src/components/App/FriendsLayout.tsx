import React, { ReactNode, useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { currentUrl } from '../../constants';
import ContentNav from './ContentNav';
import NavLink from './Friends/NavLink';
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
          <NavLink
            href="/app/friends/all"
            active={currentPath === '/app/friends/all'}
          >
            All
          </NavLink>
          <NavLink
            href="/app/friends/online"
            active={currentPath === '/app/friends/online'}
          >
            Online
          </NavLink>
          <NavLink
            href="/app/friends/pending"
            active={currentPath === '/app/friends/pending'}
          >
            Pending
          </NavLink>
          <NavLink
            href="/app/friends/add"
            active={currentPath === '/app/friends/add'}
          >
            Add friend
          </NavLink>
        </div>
        <div>{children}</div>
      </ContentNav>
    </Layout>
  );
};

export default FriendsLayout;
