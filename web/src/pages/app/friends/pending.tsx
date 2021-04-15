import Head from 'next/head';
import React from 'react';
import IncomingRequestTab from '../../../components/App/Friends/IncomingRequestTab';
import OutgoingRequestTab from '../../../components/App/Friends/OutgoingRequestTab';
import FriendsLayout from '../../../components/App/FriendsLayout';
import { useMeQuery } from '../../../generated/graphql';
import withAuth from '../../../utils/withAuth';
export interface PendingRequestsProps {}

const PendingRequests: React.FC<PendingRequestsProps> = () => {
  const { data: meData, isLoading } = useMeQuery();
  const requests = meData?.me?.friend_requests;

  return (
    <>
      <Head>
        <title>Biscit | Pending friends</title>
      </Head>
      <FriendsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {requests && requests.incoming.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                Incoming friend requests - {requests?.incoming.length}
              </p>
              <div>
                {requests.incoming.map((request) => {
                  return (
                    <IncomingRequestTab request={request} key={request.id} />
                  );
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
                  return (
                    <OutgoingRequestTab request={request} key={request.id} />
                  );
                })}
              </div>
            </div>
          ) : null}

          {!isLoading &&
          (!requests ||
            (requests.incoming.length === 0 &&
              requests.outcoming.length === 0)) ? (
            <div className="w-full h-full flex flex-col justify-center items-center absolute">
              <img
                src="/pending_splash.svg"
                alt="Pending splash image"
                className="w-2/5 max-w-4xl opacity-20"
              />
            </div>
          ) : null}
        </div>
      </FriendsLayout>
    </>
  );
};

export default withAuth(PendingRequests);
