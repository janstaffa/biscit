import { useRouter } from 'next/router';
import React from 'react';
import { BiMessageAltDetail } from 'react-icons/bi';
import { HiDotsVertical } from 'react-icons/hi';
import { ImCross } from 'react-icons/im';
import { IoMdCall } from 'react-icons/io';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Popup } from 'react-tiny-modals';
import { genericErrorMessage } from '../../../constants';
import { ThreadSnippetFragment, useDeleteThreadMutation, useLeaveThreadMutation } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast } from '../../../utils/toasts';

export interface ThreadTabProps {
  thread: ThreadSnippetFragment;
  myId: string | undefined;
}

const ThreadTab: React.FC<ThreadTabProps> = ({ thread: { id, name }, thread, myId }) => {
  const router = useRouter();

  const { mutate: deleteThread } = useDeleteThreadMutation({
    onSuccess: (data) => {
      if (!data.DeleteThread.data) {
        errorToast(genericErrorMessage);
      }
      queryClient.invalidateQueries('Threads');
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });
  const { mutate: leaveThread } = useLeaveThreadMutation({
    onSuccess: (data) => {
      if (!data.LeaveThread.data) {
        errorToast(genericErrorMessage);
      }
      queryClient.invalidateQueries('Threads');
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });
  return (
    <div className="w-full h-16 bg-dark-100 hover:bg-dark-50">
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <div className="w-11 h-11 rounded-full bg-light"></div>
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">{name}</div>
            </div>
            <div className="flex flex-row items-center">
              <BiMessageAltDetail
                className="text-light-300 text-2xl mx-2 hover:text-light-200"
                title="Message"
                onClick={() => router.push(`/app/chat/${id}`)}
              />
              <IoMdCall className="text-light-300 text-2xl mx-2 hover:text-light-200" title="Call" />
              <Popup
                position={['left', 'bottom', 'top', 'right']}
                onClickOutside={({ setShow }) => setShow(false)}
                content={({ setShow }) => (
                  <div className="w-auto h-auto bg-dark-300 cursor-default select-none rounded-md p-3">
                    <div className="w-44">
                      <ul>
                        {thread.creatorId !== myId && (
                          <li
                            className="text-red-600 font-opensans text-center p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                            onClick={() => {
                              leaveThread({ options: { threadId: thread.id } });
                            }}
                          >
                            <ImCross size={18} style={{ marginRight: '5px' }} />
                            Leave thread
                          </li>
                        )}
                        {thread.creatorId === myId && (
                          <li
                            className="text-red-600 font-opensans text-center p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                            onClick={() => {
                              const ok = confirm('Are you sure, you want to delete this thread?');
                              if (ok) {
                                deleteThread({ options: { threadId: thread.id } });
                                return;
                              }
                              setShow(false);
                            }}
                          >
                            <RiDeleteBin6Line size={20} style={{ marginRight: '5px' }} />
                            Delete thread
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              >
                {({ show, setShow }) => (
                  <div>
                    <HiDotsVertical
                      className="text-light-300 text-2xl mx-2 hover:text-light-200"
                      title="Options"
                      onClick={() => setShow(!show)}
                    />
                  </div>
                )}
              </Popup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadTab;
