import { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import FriendsLayout from '../../../components/App/Friends/FriendsLayout';
import FriendTab from '../../../components/App/Friends/FriendTab';
import SplashScreen from '../../../components/SplashScreen';
import { useMeQuery } from '../../../generated/graphql';
import withAuth from '../../../utils/withAuth';

const AllFriends: NextPage = () => {
  const { data: meData, isLoading } = useMeQuery();
  const friends = meData?.me?.friends;
  return (
    <>
      <Head>
        <title>Biscit | All friends</title>
      </Head>
      <FriendsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {!isLoading && friends && friends.length > 0 ? (
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
            <SplashScreen
              src="/all_splash.svg"
              alt="Pending splash image"
              caption="You have no friends yet, you can add them in the Add friend tab."
            />
          )}
        </div>
      </FriendsLayout>
    </>
  );
};

export default withAuth(AllFriends);
