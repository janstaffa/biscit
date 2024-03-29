import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { FaRegSmile } from 'react-icons/fa';
import { GoReply } from 'react-icons/go';
import { ImAttachment } from 'react-icons/im';
import { BeatLoader } from 'react-spinners';
import { Popup } from 'react-tiny-modals';
import { MessageSnippetFragment } from '../../../generated/graphql';
import { attachment, OutgoingSocketChatMessage, SocketThreadMessage, TypingMessage } from '../../../types';
import { socket } from '../../../utils/createWSconnection';
import { errorToast } from '../../../utils/toasts';
import { uploadAttachment } from '../../../utils/uploadFile';
import AttachmentBar from './AttachmentBar';
import FileDropZone from './FileDropZone';

export interface ChatBottomBarProps {
  threadId: string;
  replyMessage: MessageSnippetFragment | null;
  setReplyMessage: React.Dispatch<React.SetStateAction<MessageSnippetFragment | null>>;
}

const emojis = [
  '😂',
  '🤣',
  '😎',
  '😃',
  '😍',
  '👌',
  '👋',
  '❤',
  '✔',
  '😁',
  '👍',
  '🤢',
  '👀',
  '✌',
  '🤞',
  '😉',
  '😢',
  '😜',
  '🎉',
  '📞',
  '🧠',
  '⁉',
  '🎁',
  '💋',
  '👏',
  '🎶',
  '😴',
  '😓',
  '😖',
  '😤',
  '🤯',
  '😨',
  '😭',
  '🤑',
  '😱',
  '🥶',
  '😷',
  '🤬',
  '😡',
  '🤡',
  '🥳',
  '😇'
];

const ChatBottomBar: React.FC<ChatBottomBarProps> = ({ replyMessage, setReplyMessage, threadId }) => {
  const threadIdRef = useRef<string>();
  threadIdRef.current = threadId;
  const [typing, setTyping] = useState<{ username: string } | null>(null);
  const [messageInputValue, setMessageInputValue] = useState<string>('');
  const messageInputValueRef = useRef<string>('');
  messageInputValueRef.current = messageInputValue;
  const replyMessageRef = useRef<MessageSnippetFragment | null>(null);
  replyMessageRef.current = replyMessage;

  const [attachments, setAttachments] = useState<attachment[]>([]);
  const attachmentRef = useRef<attachment[]>([]);
  attachmentRef.current = attachments;

  const messageInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setMessageInputValue('');
    const ws = socket.connect();
    if (!ws) return;

    let resetTyping: NodeJS.Timeout | null;
    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      if (incoming.code === 3006) {
        const { username, threadId: incomingThreadId } = incoming as TypingMessage;
        if (incomingThreadId !== threadId) return;

        if (resetTyping) {
          clearTimeout(resetTyping);
          resetTyping = null;
        }
        resetTyping = setTimeout(() => {
          setTyping(null);
        }, 2000);

        setTyping({ username });
      }
    };
    const handleEnterListener = () => {
      if (!messageInput.current) return;

      messageInput.current.addEventListener('keyup', (e) => {
        if (!e.repeat && e.key === 'Enter') {
          const value = messageInputValueRef.current;
          if (attachmentRef.current.length === 0 && (!value || !/\S/.test(value))) {
            return;
          }

          let payload = {
            code: 3000,
            threadId: threadIdRef.current,
            content: value,
            media: attachmentRef.current.length > 0 ? attachmentRef.current.map((at) => at.id) : null
          } as OutgoingSocketChatMessage;

          if (replyMessageRef.current) {
            payload = {
              ...payload,
              replyingToId: replyMessageRef.current.id
            };
          }
          try {
            if (ws.readyState === ws.OPEN) {
              socket.send(JSON.stringify(payload));
              setAttachments([]);
              setReplyMessage(null);
              setMessageInputValue('');
              messageInput.current?.focus();
            }
          } catch (err) {
            console.error(err);
          }
        }
      });
    };
    try {
      ws.addEventListener('message', handleMessage);

      ws.addEventListener('open', handleEnterListener);
      if (ws.readyState === ws.OPEN) {
        handleEnterListener();
      }
    } catch (err) {
      console.error(err);
    }

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('open', handleEnterListener);
    };
  }, [threadId]);

  useEffect(() => {
    const ws = socket.connect();

    if (ws && messageInputValueRef.current) {
      const payload: SocketThreadMessage = {
        code: 3006,
        threadId
      };
      socket.send(JSON.stringify(payload));
    }
  }, [messageInputValue]);

  useEffect(() => {
    if (replyMessage) {
      messageInput.current?.focus();
    }
  }, [replyMessage]);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const showDropZone = (e: DragEvent) => {
    const dt = e.dataTransfer;
    if (dt && dt.types && (dt.types.indexOf ? dt.types.indexOf('Files') !== -1 : dt.types.includes('Files'))) {
      setIsDragging(true);
      return;
    }
    setIsDragging(false);
  };

  const hideDropZone = (e: DragEvent) => {
    if (!e.relatedTarget) {
      setIsDragging(false);
    }
  };
  useEffect(() => {
    document.addEventListener('dragenter', showDropZone, false);
    document.addEventListener('dragleave', hideDropZone, false);
    document.addEventListener('drop', hideDropZone, false);
    return () => {
      document.removeEventListener('dragenter', showDropZone, false);
      document.removeEventListener('dragleave', hideDropZone, false);
      document.removeEventListener('drop', hideDropZone, false);
    };
  }, []);

  const fileInput = useRef<HTMLInputElement | null>(null);
  return (
    <>
      {isDragging && <FileDropZone attachments={attachmentRef.current} setAttachments={setAttachments} />}

      {attachments.length > 0 && <AttachmentBar attachments={attachments} setAttachments={setAttachments} />}
      {replyMessage && (
        <div className="w-full h-auto flex flex-row justify-between items-center px-10 py-1 bg-dark-200">
          <span className="text-light-400 font-roboto flex flex-row items-center">
            <GoReply className="mr-2" />
            replying to {replyMessage.user.username}
          </span>
          <AiOutlineCloseCircle
            className="text-light-400 cursor-pointer hover:text-light-300"
            size={18}
            onClick={() => setReplyMessage(null)}
            title={'cancel replying'}
          />
        </div>
      )}
      <div className="w-full h-24 bg-dark-300 px-8 flex flex-col justify-center relative" style={{ minHeight: '6rem' }}>
        <div className="flex flex-row">
          <div
            className="w-14 bg-dark-100 flex flex-col justify-center items-center border-r border-dark-50 rounded-l-xl"
            style={{ minWidth: '3.5rem' }}
          >
            <ImAttachment
              className="text-2xl text-light-300 cursor-pointer"
              onClick={() => {
                fileInput.current?.click();
              }}
            />
            <input
              type="file"
              className="hidden"
              multiple
              ref={fileInput}
              onChange={async (e) => {
                const files = e.target.files;

                if (files) {
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file) {
                      if (!file.type) {
                        errorToast('Only valid files are accepted.');
                        return;
                      }
                      const newAttachment = await uploadAttachment(file, threadId);
                      setAttachments([...attachmentRef.current, newAttachment]);
                    }
                  }
                }
              }}
            />
          </div>
          <div className="flex-grow justify-center">
            <input
              className="w-full h-12 bg-dark-100 outline-none text-light-200 px-4 text-base font-roboto flex resize-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              placeholder="press 'enter' to send the message"
              value={messageInputValue}
              ref={messageInput}
              onChange={(e) => setMessageInputValue(e.target.value)}
            />
          </div>
          <Popup
            position={['top', 'left', 'right', 'bottom']}
            closeOnClickOutside={true}
            outerPadding={5}
            align={'end'}
            content={() => (
              <div className="w-64 h-36 bg-dark-300 rounded-md p-1 flex flex-row flex-wrap">
                {emojis.map((emoji, i) => (
                  <span
                    className="emoji"
                    key={i}
                    onClick={(e) => {
                      const input = document.getElementById('message-input') as HTMLInputElement;
                      setMessageInputValue(messageInputValue + (e.target as HTMLSpanElement).innerText);
                      input.focus();
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            )}
          >
            {({ show, setShow }) => (
              <div
                className="w-20 h-12 bg-dark-100 rounded-r-xl flex flex-row justify-center items-center"
                style={{ minWidth: '5rem' }}
              >
                <FaRegSmile className="text-2xl text-light-300 cursor-pointer" onClick={() => setShow(!show)} />
              </div>
            )}
          </Popup>
        </div>
        <div className="w-full h-5 text-light-300 text-md mt-1 ml-1 font-roboto flex flex-row items-center">
          {typing && (
            <>
              <span className="mr-2">
                <BeatLoader color="#e09f3e" size={6} />
              </span>
              <span>{typing.username} is typing</span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(ChatBottomBar);
