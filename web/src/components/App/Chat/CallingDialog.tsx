// export interface CallingDialogProps {}
import React, { useEffect, useRef, useState } from 'react';
import { HiPhone, HiPhoneMissedCall } from 'react-icons/hi';
import { ThreadSnippetFragment, useCancelCallMutation, UserSnippetFragment } from '../../../generated/graphql';
import { errorToast } from '../../../utils/toasts';

export type CallingDialog = {
  user: UserSnippetFragment | null;
  thread: ThreadSnippetFragment | null;
  myId: string | undefined;
  setIsCalling: React.Dispatch<React.SetStateAction<boolean>>;
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
const CallingDialog: React.FC<CallingDialog> = ({ user, thread, myId, setIsCalling }) => {
  const { mutate: cancelCallMutate } = useCancelCallMutation();

  const isMe = user?.id === myId;

  const cancelCall = () => {
    if (!thread) return;
    cancelCallMutate(
      { options: { threadId: thread.id } },
      {
        onSuccess: (d) => {
          if (!d.CancelCall.data && d.CancelCall.errors.length > 0) {
            d.CancelCall.errors.forEach((err) => {
              errorToast(err.details?.message);
            });
          }
        }
      }
    );
    setIsCalling(false);
  };
  return (
    <div
      className="w-72 h-52 bg-dark-300 absolute top-20 p-2 text-center rounded-md"
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
                onClick={() => {
                  cancelCall();
                }}
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
              <button className="px-3 py-1 bg-lime-100 hover:bg-lime-200 rounded-md mb-3 mx-1 flex flex-row items-center font-roboto">
                <HiPhone size={20} className="mr-2" />
                {thread?.isDm ? 'Accept' : 'Join'}
              </button>
              <button
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md mb-3 mx-1 flex flex-row items-center font-roboto"
                onClick={() => {
                  cancelCall();
                }}
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
