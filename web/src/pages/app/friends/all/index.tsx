import Head from 'next/head';
import React from 'react';
import FriendTab from '../../../../components/App/Friends/FriendTab';
import FriendsLayout from '../../../../components/App/FriendsLayout';
import { useMeQuery } from '../../../../generated/graphql';
import withAuth from '../../../../utils/withAuth';
export interface AllFriendsProps {}

const AllFriends: React.FC<AllFriendsProps> = () => {
  const { data: meData } = useMeQuery();
  return (
    <>
      <Head>
        <title>Biscit | All friends</title>
      </Head>
      <FriendsLayout>
        <div className="p-2">
          <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
            All friends - {meData?.me?.friends?.length}
          </p>
          <div>
            {meData?.me?.friends?.map((friendship) => {
              const { friend } = friendship;
              return (
                <FriendTab
                  friendId={friendship.key}
                  friend={friend}
                  key={friendship.id}
                />
              );
            })}
          </div>
        </div>
      </FriendsLayout>
    </>
  );
};

export default withAuth(AllFriends);
