import Head from 'next/head';
import React from 'react';
import FriendTab from '../../../components/App/Friends/FriendTab';
import FriendsLayout from '../../../components/App/FriendsLayout';
import { useMeQuery } from '../../../generated/graphql';
import withAuth from '../../../utils/withAuth';
export interface AllFriendsProps {}

const AllFriends: React.FC<AllFriendsProps> = () => {
  const { data: meData } = useMeQuery();
  const friends = meData?.me?.friends;
  return (
    <>
      <Head>
        <title>Biscit | All friends</title>
      </Head>
      <FriendsLayout>
        {friends && friends.length > 0 ? (
          <div className="p-2 pt-16 bg-dark-200">
            <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
              All friends - {friends.length}
            </p>
            <div>
              {friends.map((friendship) => {
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
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center absolute">
            <img
              src="/all_splash.svg"
              alt="Pending splash image"
              className="w-2/5 max-w-4xl opacity-20"
            />
          </div>
        )}
      </FriendsLayout>
    </>
  );
};

export default withAuth(AllFriends);
