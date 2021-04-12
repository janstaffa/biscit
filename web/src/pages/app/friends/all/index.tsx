import Head from 'next/head';
import React from 'react';
import FriendTab from '../../../../components/App/Friends/FriendTab';
import FriendsLayout from '../../../../components/App/FriendsLayout';
export interface AllFriendsProps {}

const AllFriends: React.FC<AllFriendsProps> = () => {
  return (
    <>
      <Head>
        <title>Biscit | All friends</title>
      </Head>
      <FriendsLayout>
        <div className="p-2">
          <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
            All friends - 5
          </p>
          <div>
            <FriendTab username="John" bio="babel is very good" />
            <FriendTab username="John" bio="babel is very good" />

            <FriendTab username="John" bio="babel is very good" />
          </div>
        </div>
      </FriendsLayout>
    </>
  );
};

export default AllFriends;
