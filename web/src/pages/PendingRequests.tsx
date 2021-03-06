import React from 'react';
import { Helmet } from 'react-helmet-async';
import FriendsLayout from '../components/App/Friends/FriendsLayout';
import IncomingRequestTab from '../components/App/Friends/IncomingRequestTab';
import OutgoingRequestTab from '../components/App/Friends/OutgoingRequestTab';
import SplashScreen from '../components/SplashScreen';
import { useMeQuery } from '../generated/graphql';

const PendingRequests: React.FC = () => {
  const { data: meData, isLoading } = useMeQuery();
  const requests = meData?.me?.friend_requests;

  return (
    <>
      <Helmet>
        <title>Biscit | Pending friends</title>
      </Helmet>
      <FriendsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {requests && requests.incoming.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                Incoming friend requests - {requests?.incoming.length}
              </p>
              <div>
                {requests.incoming.map((request) => {
                  return <IncomingRequestTab request={request} key={request.id} />;
                })}
              </div>
            </div>
          ) : null}
          {requests && requests.outcoming.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                Outgoing friend requests - {requests?.outcoming.length}
              </p>
              <div>
                {requests.outcoming.map((request) => {
                  return <OutgoingRequestTab request={request} key={request.id} />;
                })}
              </div>
            </div>
          ) : null}

          {!isLoading && (!requests || (requests.incoming.length === 0 && requests.outcoming.length === 0)) ? (
            <SplashScreen
              src="/pending_splash.svg"
              alt="Pending splash image"
              caption="You have no pending friend requests."
            />
          ) : null}
        </div>
      </FriendsLayout>
    </>
  );
};

export default PendingRequests;
