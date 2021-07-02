import React, { useContext, useEffect, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { FaUser } from 'react-icons/fa';
import { HiPhoneMissedCall } from 'react-icons/hi';
import { IoMdCall } from 'react-icons/io';
import { VscMute } from 'react-icons/vsc';
import { Link } from 'react-router-dom';
import { profilepApiURL } from '../../../constants';
import { ThreadSnippetFragment } from '../../../generated/graphql';
import { TypingMessage } from '../../../types';
import { socket } from '../../../utils/createWSconnection';
import { formatTime } from '../../../utils/formatTime';
import { RTCcontext } from '../../../utils/RTCProvider';

export interface ThreadButtonProps {
  thread: ThreadSnippetFragment;
  unread: boolean;
  threadId: string;
  isCalling: boolean;
  active?: boolean;
}

const ThreadButton: React.FC<ThreadButtonProps> = ({ thread, unread, threadId, isCalling = false, active = false }) => {
  const [displayMessage, setDisplayMessage] = useState<string | null | undefined>();
  const [currentLatestMessage, setCurrentLatestMessage] = useState<string | null | undefined>();
  const currentDisplayMessageRef = useRef<string | null | undefined>();
  currentDisplayMessageRef.current = currentLatestMessage;
  const [userTyping, setUserTyping] = useState<string | null>(null);

  useEffect(() => {
    const ws = socket.connect();
    if (!ws) return;

    let resetTyping: NodeJS.Timeout | null;
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);

      if (incoming.code === 3006) {
        const { username: incomingUsername, threadId: incomingThreadId } = incoming as TypingMessage;
        if (incomingThreadId === threadId) {
          setUserTyping(incomingUsername);
          if (resetTyping) {
            clearTimeout(resetTyping);
            resetTyping = null;
          }
          resetTyping = setTimeout(() => {
            setUserTyping(null);
          }, 2000);
        }
      }
    };
    try {
      ws.addEventListener('message', handleMessage);
    } catch (err) {
      console.error(err);
    }

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (thread.lastMessage) {
      let lastMessage = thread.lastMessage.content;
      if (!thread.isDm) {
        lastMessage = thread.lastMessage.user.username + ': ' + thread.lastMessage.content;
      }
      setDisplayMessage(lastMessage);
      setCurrentLatestMessage(thread.lastMessage.content);
    }
  }, [thread.lastMessage]);

  const profilePictureId = thread.thread_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;

  const rtcContext = useContext(RTCcontext);
  return (
    <Link to={`/app/chat/${threadId}`}>
      <div className={'py-1 rounded-sm' + (active ? '  bg-dark-50' : ' hover:bg-dark-100')}>
        <div className="w-full h-16 flex flex-row items-center cursor-pointer py-2">
          <div className="w-16 h-full flex flex-col justify-center items-center">
            <div className="w-11 h-11 rounded-full bg-light-400 flex flex-col justify-center items-center">
              {profilePictureSrc ? (
                <img src={profilePictureSrc || ''} className="w-full h-full rounded-full" />
              ) : (
                <FaUser size={30} className="text-dark-100" />
              )}
            </div>
          </div>
          <div className="w-full flex-1 px-2">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-center">
                <div className=" text-light font-roboto truncate w-48">{thread.name}</div>
                {!isCalling && (
                  <div className=" text-light-200 text-sm font-roboto">{formatTime(thread.lastActivity)}</div>
                )}
              </div>
              <div className=" w-full flex flex-row justify-between">
                {isCalling ? (
                  <>
                    <div className="text-lime-200 w-auto font-roboto text-sm truncate flex flex-row items-center">
                      <IoMdCall size={24} className="mr-2" /> <span className="text-base font-bold">in call...</span>
                    </div>
                    <div className="w-36 flex flex-row justify-center items-center">
                      <button
                        className={
                          'w-8 h-8 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-1 hover:text-black transition-all delay-75' +
                          (rtcContext?.options.mic
                            ? ' text-light-300 hover:bg-light-400'
                            : ' text-black bg-red-500 border-none')
                        }
                        title={rtcContext?.options.mic ? 'Mute your microphone' : 'Unmute your microphone'}
                        onClick={(e) => {
                          e.preventDefault();
                          rtcContext?.handleStreamChange(
                            !rtcContext?.options.mic,
                            rtcContext?.options.camera,
                            rtcContext?.options.screenShare
                          );
                        }}
                      >
                        <AiOutlineAudioMuted size={16} />
                      </button>
                      <button
                        className={
                          'w-8 h-8 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-1 hover:text-black transition-all delay-75' +
                          (rtcContext?.options.isDeafened
                            ? ' text-black bg-red-500 border-none'
                            : ' text-light-300 hover:bg-light-400')
                        }
                        title="Volume off"
                        onClick={(e) => {
                          e.preventDefault();
                          rtcContext?.handleDeafen(!rtcContext?.options.isDeafened);
                        }}
                      >
                        <VscMute size={16} />
                      </button>
                      <button
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex flex-col justify-center items-center mx-1"
                        title="Leave call"
                        onClick={(e) => {
                          e.preventDefault();
                          rtcContext?.leaveCall();
                        }}
                      >
                        <HiPhoneMissedCall size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-light-300 w-48 font-roboto text-sm truncate">
                      {userTyping
                        ? `${userTyping} is typing...`
                        : (thread.lastMessage?.media && thread.lastMessage.media.length > 0 ? '<attachment>' : '') +
                          ' ' +
                          (displayMessage || '')}
                    </div>
                    <div className="w-8 flex flex-row justify-center items-center">
                      {unread && <div className="w-4 h-4 bg-light rounded-full"></div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThreadButton;
