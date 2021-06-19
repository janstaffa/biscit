import React from 'react';
import { Helmet } from 'react-helmet-async';
import ThreadsLayout from '../components/App/Threads/ThreadsLayout';
import ThreadTab from '../components/App/Threads/ThreadTab';
import SplashScreen from '../components/SplashScreen';
import { useMeQuery, useThreadsQuery } from '../generated/graphql';

const MyThreads: React.FC = () => {
  const { data: meData } = useMeQuery();
  const { data: loadedThreads, isLoading } = useThreadsQuery();
  const threads = loadedThreads?.threads.filter((t) => (t.thread.creatorId = meData?.me?.id) && !t.thread.isDm);

  return (
    <>
      <Helmet>
        <title>Biscit | My threads</title>
      </Helmet>
      <ThreadsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {threads && threads.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                My threads - {threads.length}
              </p>
              <div>
                {threads.map((thread) => {
                  return <ThreadTab thread={thread.thread} myId={meData?.me?.id} key={thread.thread.id} />;
                })}
              </div>
            </div>
          ) : null}

          {!isLoading && (!threads || (threads.length === 0 && threads.length === 0)) ? (
            <SplashScreen
              src="/pending_splash.svg"
              alt="Pending splash image"
              caption="You haven't created any threads."
            />
          ) : null}
        </div>
      </ThreadsLayout>
    </>
  );
};

export default MyThreads;
