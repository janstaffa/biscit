import React from 'react';
import { Helmet } from 'react-helmet-async';
import FriendsLayout from '../components/App/Friends/FriendsLayout';
import FriendTab from '../components/App/Friends/FriendTab';
import SplashScreen from '../components/SplashScreen';
import { Friend, useMeQuery } from '../generated/graphql';

const OnlineFriends: React.FC = () => {
  const { data: meData, isLoading } = useMeQuery();
  let friends = meData?.me?.friends;
  friends = friends?.filter((friend) => friend.friend.status === 'online');
  return (
    <>
      <Helmet>
        <title>Biscit | Online friends</title>
      </Helmet>
      <FriendsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {!isLoading && friends && friends.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                Online friends - {friends.length}
              </p>
              <div>
                {friends.map((friendship) => {
                  return <FriendTab friend={friendship as Friend} key={friendship.id} />;
                })}
              </div>
            </div>
          ) : (
            <SplashScreen
              src="/all_splash.svg"
              alt="No friends online splash image"
              caption="There are currently none of your friends online."
            />
          )}
        </div>
      </FriendsLayout>
    </>
  );
};

export default OnlineFriends;
