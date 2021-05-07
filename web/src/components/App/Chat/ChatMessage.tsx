import React, { useEffect, useState } from 'react';
import { HiDotsVertical } from 'react-icons/hi';
import { MdEdit } from 'react-icons/md';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Popover } from 'react-tiny-popover';
import { genericErrorMessage } from '../../../constants';
import { MessageSnippetFragment, useDeleteMessageMutation, useUpdateMessageMutation } from '../../../generated/graphql';
import { formatTime } from '../../../utils/formatTime';
import { errorToast } from '../../../utils/toasts';
export interface ChatMessageProps {
  message: MessageSnippetFragment;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { mutate: updateMessage } = useUpdateMessageMutation({
    onSuccess: (data) => {
      if (!data.UpdateMessage.data) {
        errorToast(genericErrorMessage);
      }
      // queryClient.invalidateQueries('Me');
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });
  const { mutate: deleteMessage } = useDeleteMessageMutation({
    onSuccess: (data) => {
      if (!data.DeleteMessage.data) {
        errorToast(genericErrorMessage);
      }
      // queryClient.invalidateQueries('Me');
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
      if (updateFieldValue.length > 0) {
        updateMessage({ options: { messageId: message.id, newContent: updateFieldValue } });
        setIsEditing(false);
      } else {
        deleteMessage({ options: { messageId: message.id } });
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    });
  }, []);
  return (
    <div
      className="w-full h-auto my-2.5 flex flex-row hover:shadow-lg"
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
        </div>
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
          >
            {updateFieldValue}
          </div>
        )}
      </div>
      <div
        className="w-auto h-16 flex flex-col justify-center items-center"
        style={{ visibility: isHovering ? 'visible' : 'hidden' }}
      >
        <Popover
          isOpen={isHovering ? isPopoverOpen : false}
          positions={['left', 'bottom', 'top', 'right']}
          onClickOutside={() => setIsPopoverOpen(false)}
          content={
            <div className="w-auto h-auto bg-dark-300 cursor-default select-none rounded-md p-3">
              <div className="w-32">
                <ul>
                  <li
                    className="text-red-600 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                    onClick={() => {
                      setIsPopoverOpen(false);
                      deleteMessage({ options: { messageId: message.id } });
                    }}
                  >
                    <RiDeleteBin6Line size={20} style={{ marginRight: '5px' }} />
                    Delete
                  </li>
                  <li
                    className="text-light-200 font-opensans text-left p-2 hover:bg-dark-200 cursor-pointer flex flex-row items-center"
                    onClick={() => {
                      setIsPopoverOpen(false);
                      setIsEditing(true);
                    }}
                  >
                    <MdEdit size={20} style={{ marginRight: '5px' }} />
                    Edit
                  </li>
                </ul>
              </div>
            </div>
          }
        >
          <div>
            <HiDotsVertical
              className="text-light-300 text-2xl mx-2 hover:text-light-200 cursor-pointer"
              title="Options"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            />
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
