import React, { ReactNode, useEffect, useState } from 'react';
import { FaUserFriends } from 'react-icons/fa';
import { currentUrl } from '../../../constants';
import NavLink from '../../Buttons/NavLink';
import ContentNav from '../ContentNav';
import Layout from '../Layout';

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
        <div className="flex flex-row items-center h-full select-none">
          <div className="border-r border-light-300 px-4 mr-2">
            <FaUserFriends className="text-light-300 text-2xl" />
          </div>
          <NavLink href="/app/friends/all" active={currentPath === '/app/friends/all'}>
            All
          </NavLink>
          <NavLink href="/app/friends/online" active={currentPath === '/app/friends/online'}>
            Online
          </NavLink>
          <NavLink href="/app/friends/pending" active={currentPath === '/app/friends/pending'}>
            Pending
          </NavLink>
          <NavLink
            href="/app/friends/add"
            className={
              'border-lime-300 border-2 text-lime-200 font-bold mx-2 px-3 rounded-full cursor-pointer ml-5' +
              (currentPath === '/app/friends/add' ? ' bg-dark-50' : ' hover:bg-dark-50 bg-dark-100')
            }
          >
            Add friend
          </NavLink>
        </div>
      </ContentNav>
      <div className="w-full h-full overflow-hidden relative">{children} </div>
    </Layout>
  );
};

export default FriendsLayout;
