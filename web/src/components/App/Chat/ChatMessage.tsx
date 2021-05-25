import React, { useEffect, useState } from 'react';
import { GoReply } from 'react-icons/go';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdRefresh } from 'react-icons/io';
import { MdEdit } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Popup } from 'react-tiny-modals';
import { genericErrorMessage } from '../../../constants';
import {
  FileSnippetFragment,
  MessageSnippetFragment,
  useDeleteMessageMutation,
  useUpdateMessageMutation
} from '../../../generated/graphql';
import { formatMessage } from '../../../utils/formatMessage';
import { formatTime } from '../../../utils/formatTime';
import { errorToast } from '../../../utils/toasts';
import Attachment from './Attachment';
export interface ChatMessageProps {
  message: MessageSnippetFragment;
  myId: string | undefined;
  resendCall: () => void;
  replyCall: () => void;
  replyMessage: MessageSnippetFragment | null;
  onReady?: () => void;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  myId,
  resendCall,
  replyCall,
  replyMessage,
  onReady,
  setGalleryFile
}) => {
  const { mutate: updateMessage } = useUpdateMessageMutation({
    onSuccess: (data) => {
      if (!data.UpdateMessage.data) {
        errorToast(genericErrorMessage);
      }
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });
  const { mutate: deleteMessage } = useDeleteMessageMutation({
    onSuccess: (data) => {
      if (!data.DeleteMessage.data) {
        data.DeleteMessage.errors.forEach((err) => {
          errorToast(err.details?.message);
        });
      }
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [updateFieldValue, setUpdateFieldValue] = useState<string>(message.content);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if ((updateFieldValue && /\S/.test(updateFieldValue)) || message.media) {
        updateMessage({ options: { messageId: message.id, newContent: updateFieldValue } });
        setIsEditing(false);
      } else {
        deleteMessage({ options: { messageId: message.id } });
      }
    }
  };

  useEffect(() => {
    onReady?.();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    });
  }, []);

  return (
    <div
      className={
        'message w-full h-auto my-2.5 flex flex-row hover:shadow-lg' +
        (replyMessage?.id === message.id ? ' ring-2 ring-accent-light' : ' bg-transparent')
      }
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsPopoverOpen(false);
      }}
    >
      <div className="h-16 w-16 flex flex-col justify-center items-center">
        <div className="w-12 h-12 bg-white rounded-full"></div>
      </div>
      <div className="flex-1 flex flex-col px-2 py-1">
        <div className="flex flex-row">
          <div className="text-light font-roboto text-base">{message.user.username}</div>
          <div className="text-light-300 font-roboto text-sm flex flex-col justify-center ml-2">
            {formatTime(message.createdAt)}
          </div>
          {message.edited && (
            <div className="text-light-400 font-roboto text-xs flex flex-col justify-center ml-1">(edited)</div>
          )}
          {!!message.resendId && (
            <div className="text-light-400 font-roboto text-xs flex flex-row items-center ml-1">
              ( <IoMdRefresh className="mr-1" />
              resended)
            </div>
          )}
          {!!message.replyingToId && (
            <div className="text-light-400 font-roboto text-xs flex flex-row items-center ml-1">
              <GoReply className="mr-1" />
              replying to {message.replyingTo?.user.username}: {message.replyingTo?.content}
            </div>
          )}
        </div>
        {message.media && (
          <div className="flex flex-col">
            {message.media.length > 0 &&
              message.media.map((file) => {
                console.log(formatTime(message.createdAt), message.media);
                return <Attachment file={file} key={file.id} setGalleryFile={setGalleryFile} />;
              })}
          </div>
        )}
        {isEditing ? (
          <textarea
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={
              'text-light-200 font-roboto text-md outline-none resize-none h-auto' +
              (isEditing ? ' bg-dark-200 p-2' : ' bg-dark-100')
            }
            value={updateFieldValue}
            onKeyDown={(e) => handleKeyDown(e)}
            onChange={(e) => {
              setUpdateFieldValue(e.target.value);
            }}
          ></textarea>
        ) : (
          <div
            className={
              'text-light-200 font-roboto text-md outline-none resize-none h-auto' +
              (isEditing ? ' bg-dark-200 p-2' : ' bg-dark-100')
            }
            dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
          ></div>
        )}
      </div>
      <div
        className="w-auto h-16 flex flex-col justify-center items-center"
        style={{ visibility: isHovering ? 'visible' : 'hidden' }}
      >
        <Popup
          isOpen={isHovering ? isPopoverOpen : false}
          position={['left', 'bottom', 'top', 'right']}
          reposition={false}
          onClickOutside={({ setShow }) => setShow(false)}
          onClose={() => setIsPopoverOpen(false)}
          onOpen={() => setIsPopoverOpen(true)}
          content={({ setShow }) => (
            <div className="w-auto h-auto bg-dark-300 cursor-default select-none rounded-md p-3">
              <div className="w-48">
                <ul>
                  <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-row items-center">
                    Sent {formatTime(message.createdAt, { fullDate: true })}
                  </li>
                  {message.edited && (
                    <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-row items-center">
                      Edited {formatTime(message.updatedAt, { fullDate: true })}
                    </li>
                  )}
                  <hr className="bg-dark-50 h-px border-none mt-1" />
                  {message.userId === myId && (
                    <>
                      <li
                        className="text-red-600 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                        onClick={() => {
                          setShow(false);
                          deleteMessage({ options: { messageId: message.id } });
                        }}
                      >
                        <RiDeleteBin6Line size={20} style={{ marginRight: '5px' }} />
                        Delete
                      </li>
                      {message.content && (
                        <li
                          className="text-light-200 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                          onClick={() => {
                            setShow(false);
                            setIsEditing(true);
                          }}
                        >
                          <MdEdit size={20} style={{ marginRight: '5px' }} />
                          Edit
                        </li>
                      )}
                      <hr className="bg-dark-50 h-px border-none" />
                    </>
                  )}
                  {message.userId !== myId && (
                    <li
                      className="text-light-200 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                      onClick={() => replyCall()}
                    >
                      <GoReply size={20} style={{ marginRight: '5px' }} />
                      Reply
                    </li>
                  )}
                  <li
                    className="text-light-200 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                    onClick={() => resendCall()}
                  >
                    <IoMdRefresh size={20} style={{ marginRight: '5px' }} />
                    Resend
                  </li>
                </ul>
              </div>
            </div>
          )}
        >
          {({ show, setShow }) => (
            <div>
              <HiDotsVertical
                className="text-light-300 text-2xl mx-2 hover:text-light-200 cursor-pointer"
                title="Options"
                onClick={() => setShow(!show)}
              />
            </div>
          )}
        </Popup>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
