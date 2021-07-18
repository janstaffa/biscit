import React from 'react';
import { Helmet } from 'react-helmet-async';
import FriendsLayout from '../components/App/Friends/FriendsLayout';
import FriendTab from '../components/App/Friends/FriendTab';
import SplashScreen from '../components/SplashScreen';
import { Friend, useMeQuery } from '../generated/graphql';

const AllFriends: React.FC = () => {
  const { data: meData, isLoading } = useMeQuery();
  const friends = meData?.me?.friends;
  return (
    <>
      <Helmet>
        <title>Biscit | All friends</title>
      </Helmet>
      <FriendsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {!isLoading && friends && friends.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                All friends - {friends.length}
              </p>
              <div>
                {friends.map((friend) => {
                  return <FriendTab friend={friend as Friend} key={friend.id} />;
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

export default AllFriends;
