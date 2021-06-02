import React, { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { Modal } from 'react-tiny-modals';
import { genericErrorMessage } from '../../constants';
import { ThreadSnippetFragment, useEditThreadMutation } from '../../generated/graphql';
import { errorToast, successToast } from '../../utils/toasts';
import SubmitButton from '../Buttons/SubmitButton';

export interface EditThreadModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  thread: ThreadSnippetFragment | undefined | null;
}

const EditThreadModal: React.FC<EditThreadModalProps> = ({ isOpen = false, setIsOpen, thread }) => {
  if (!thread) return null;
  const [show, setShow] = useState<boolean>(isOpen);
  const [editThreadNewName, setEditThreadNewName] = useState<string>(thread?.name || '');

  const { mutate: editThread } = useEditThreadMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);
  return (
    <Modal isOpen={show} zIndex={100} backOpacity={0.5} onOpen={() => setEditThreadNewName(thread?.name || '')}>
      <div className="bg-dark-200 p-5 rounded-xl w-96">
        <div className="w-full h-10 flex flex-row justify-between">
          <div className="text-light-300 text-lg font-roboto">Edit thread</div>
          <div>
            <IoMdClose
              className="text-2xl text-light-300 hover:text-light cursor-pointer"
              onClick={() => setIsOpen(false)}
            />
          </div>
        </div>
        <div className="w-full flex-grow">
          <div className="w-full h-auto flex flex-col justify-center items-center mb-3">
            <div className="w-28 h-28 bg-white rounded-full"></div>
          </div>
          <p className="text-light-300 font-opensans text-md mb-1">Thread name</p>
          <input
            type="text"
            className="w-full h-9 rounded-md bg-dark-100 focus:bg-dark-50 outline-none px-3 text-light-200"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={100}
            value={editThreadNewName}
            onChange={(e) => setEditThreadNewName(e.target.value)}
          />
          <p className="text-light-300 mt-1 text-sm">max 100 characters</p>
          <div className="w-full flex flex-row justify-end mt-6">
            <button
              className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <SubmitButton
              onClick={async () => {
                await editThread(
                  { options: { threadId: thread.id, newName: editThreadNewName } },
                  {
                    onSuccess: (d) => {
                      if (d.EditThread.data) {
                        successToast(`Thread name changed to ${editThreadNewName}`);
                        setIsOpen(false);
                      }
                      if (d.EditThread.errors.length > 0) {
                        for (const error of d.EditThread.errors) {
                          errorToast(error.details?.message);
                        }
                      }
                    }
                  }
                );
              }}
            >
              Save
            </SubmitButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditThreadModal;
