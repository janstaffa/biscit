import React from 'react';
import { Helmet } from 'react-helmet-async';
import ThreadsLayout from '../components/App/Threads/ThreadsLayout';
import ThreadTab from '../components/App/Threads/ThreadTab';
import SplashScreen from '../components/SplashScreen';
import { useMeQuery, useThreadsQuery } from '../generated/graphql';

const AllThreads: React.FC = () => {
  const { data: meData } = useMeQuery();
  const { data: loadedThreads, isLoading } = useThreadsQuery();
  const threads = loadedThreads?.threads.filter((t) => !t.thread.isDm);
  return (
    <>
      <Helmet>
        <title>Biscit | All threads</title>
      </Helmet>
      <ThreadsLayout>
        <div className="w-full h-full relative overflow-y-auto">
          {!isLoading && threads && threads.length > 0 ? (
            <div className="p-2 pt-16 bg-dark-200">
              <p className="text-light-200 text-base uppercase font-roboto px-1 py-1 border-b border-light-300">
                All threads - {threads.length}
              </p>
              <div>
                {threads.map((thread) => {
                  const { thread: t } = thread;

                  return <ThreadTab thread={t} myId={meData?.me?.id} key={t.id} />;
                })}
              </div>
            </div>
          ) : (
            <SplashScreen
              src="/all_splash.svg"
              alt="No threads splash image."
              caption="You are not a member of any threads yet."
            />
          )}
        </div>
      </ThreadsLayout>
    </>
  );
};

export default AllThreads;
