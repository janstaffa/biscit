// export interface CallingDialogProps {}
import React, { useContext, useEffect, useRef, useState } from 'react';
import { HiPhone, HiPhoneMissedCall } from 'react-icons/hi';
import { useHistory } from 'react-router';
import { ThreadSnippetFragment, useMeQuery, UserSnippetFragment } from '../../../generated/graphql';
import { RTCcontext } from '../../../utils/RTCProvider';

export type CallingDialog = {
  callId: string;
  user: UserSnippetFragment | null;
  thread: ThreadSnippetFragment | null;
};

const Clock = () => {
  const [time, setTime] = useState<number>(0);
  const timeRef = useRef<number>(time);
  timeRef.current = time;
  const [clock, setClock] = useState<string>('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(timeRef.current + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const minutes = ('00' + (time >= 60 ? Math.floor(time / 60) : '')).toString().slice(-2);
    const seconds = ('00' + (time % 60)).toString().slice(-2);
    setClock(`${minutes}:${seconds}`);
  }, [time]);

  return <p className="text-light-400 mt-2">{clock}</p>;
};
const CallingDialog: React.FC<CallingDialog> = ({ user, thread, callId }) => {
  const history = useHistory();
  const { data: meData } = useMeQuery();
  const isMe = user?.id === meData?.me?.id;
  if (!thread) return null;

  const rtcContext = useContext(RTCcontext);

  return (
    <div
      className="w-72 h-52 bg-dark-300 absolute top-20 p-2 text-center rounded-md z-50"
      style={{ left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto' }}
    >
      <div className="w-full h-full flex flex-col">
        {isMe ? (
          <>
            <div>
              <h2 className="text-light-200 text-xl">Calling...</h2>
              <h3 className="text-light-300 text-lg my-1">{thread?.name}</h3>
              <Clock />
            </div>
            <div className="w-full flex flex-row justify-center flex-grow items-end">
              <button
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md mb-3 flex flex-row items-center font-roboto"
                onClick={() => rtcContext?.cancelCall(callId)}
              >
                <HiPhoneMissedCall size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-light-200 text-xl">Incoming call</h2>
              <h3 className="text-light-300 text-lg my-1">{thread?.name}</h3>
              <Clock />
            </div>
            <div className="w-full flex flex-row justify-center flex-grow items-end">
              <button
                className="px-3 py-1 bg-lime-100 hover:bg-lime-200 rounded-md mb-3 mx-1 flex flex-row items-center font-roboto"
                onClick={() => {
                  history.push(`/app/chat/${thread.id}`);
                  rtcContext?.joinCall(callId, thread.id);
                }}
              >
                <HiPhone size={20} className="mr-2" />
                {thread?.isDm ? 'Accept' : 'Join'}
              </button>
              <button
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md mb-3 mx-1 flex flex-row items-center font-roboto"
                onClick={() => rtcContext?.cancelCall(callId)}
              >
                <HiPhoneMissedCall size={20} className="mr-2" />
                {thread?.isDm ? 'Decline' : 'Ignore'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CallingDialog;
