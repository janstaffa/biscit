import { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import ThreadsLayout from '../../../components/App/Threads/ThreadsLayout';
import ThreadTab from '../../../components/App/Threads/ThreadTab';
import SplashScreen from '../../../components/SplashScreen';
import { genericErrorMessage } from '../../../constants';
import { useMeQuery, useThreadsQuery } from '../../../generated/graphql';
import { errorToast } from '../../../utils/toasts';
import withAuth from '../../../utils/withAuth';

const MyThreads: NextPage = () => {
  const { data: meData } = useMeQuery();
  const { data: loadedThreads, isLoading } = useThreadsQuery(
    {},
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      }
    }
  );
  const threads = loadedThreads?.threads.filter((t) => (t.thread.creatorId = meData?.me?.id) && !t.thread.isDm);

  return (
    <>
      <Head>
        <title>Biscit | My threads</title>
      </Head>
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

export default withAuth(MyThreads);
