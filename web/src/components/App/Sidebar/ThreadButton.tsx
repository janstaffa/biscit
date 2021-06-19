import React, { useEffect, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { profilepApiURL } from '../../../constants';
import { ThreadSnippetFragment } from '../../../generated/graphql';
import { TypingMessage } from '../../../types';
import { socket } from '../../../utils/createWSconnection';
import { formatTime } from '../../../utils/formatTime';

export interface ThreadButtonProps {
  thread: ThreadSnippetFragment;
  unread: boolean;
  threadId: string;
  active?: boolean;
}

const ThreadButton: React.FC<ThreadButtonProps> = ({ thread, unread, threadId, active = false }) => {
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
  return (
    <Link to={`/app/chat/${threadId}`}>
      <div className={'py-1 rounded-sm' + (active ? '  bg-dark-50' : ' hover:bg-dark-100 hover:text-light-hover')}>
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
                <div className=" text-light font-roboto">{thread.name}</div>
                <div className=" text-light-200 text-sm font-roboto">{formatTime(thread.lastActivity)}</div>
              </div>
              <div className=" w-full flex flex-row justify-between">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThreadButton;
