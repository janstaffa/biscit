import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import React, { useEffect, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { MdAddAPhoto } from 'react-icons/md';
import { Modal } from 'react-tiny-modals';
import { genericErrorMessage, profilepApiURL, validProfilePictureUploadRegExp } from '../../constants';
import { ThreadSnippetFragment, useEditThreadMutation } from '../../generated/graphql';
import { errorToast, successToast } from '../../utils/toasts';
import { uploadProfilePicture } from '../../utils/uploadFile';
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

  const [isHoveringFile, setIsHoveringFile] = useState<boolean>(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const cropArea = useRef<HTMLImageElement | null>(null);

  const cropper = useRef<Cropper>();
  const profilePictureDisplay = useRef<HTMLImageElement | null>(null);

  const profilePictureId = thread.thread_picture?.id;
  const [profilePictureSrc, setProfilePictureSrc] = useState<string | undefined>();
  const [imageModalShow, setImageModalShow] = useState<boolean>(false);
  useEffect(() => {
    setProfilePictureSrc(profilePictureId && profilepApiURL + '/' + profilePictureId);
  }, [profilePictureId]);

  return (
    <>
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
              <div
                className="w-32 h-32 bg-light-400 rounded-full cursor-pointer relative flex flex-col justify-center items-center"
                onClick={() => fileInput.current?.click()}
                onMouseOver={() => setIsHoveringFile(true)}
                onMouseLeave={() => setIsHoveringFile(false)}
              >
                {profilePictureSrc ? (
                  <img
                    src={profilePictureSrc || ''}
                    className="w-full h-full rounded-full"
                    ref={profilePictureDisplay}
                  />
                ) : (
                  <FaUser size={60} className="text-dark-100" />
                )}
                <div
                  className="w-full h-full rounded-full  flex-col items-center justify-center absolute top-0"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: isHoveringFile ? 'flex' : 'none' }}
                >
                  <MdAddAPhoto size={30} className="text-light-400" />
                </div>
                <input
                  type="file"
                  className="hidden"
                  ref={fileInput}
                  accept=".jpeg,.png,.webp,.avif,.tiff,.svg"
                  onChange={(e) => {
                    if (!e.target.files || e.target.files.length !== 1) {
                      return errorToast(
                        'Something went wrong, please make sure you are uploading a single valid image file.'
                      );
                    }
                    const reader = new FileReader();
                    reader.readAsDataURL(e.target.files[0]);
                    reader.onloadend = () => {
                      if (cropArea.current && reader.result && typeof reader.result === 'string') {
                        cropArea.current.src = reader.result;
                        cropper.current = new Cropper(cropArea.current, {
                          aspectRatio: 1 / 1,
                          rotatable: false,
                          viewMode: 1
                        });
                      }
                    };
                    setImageModalShow(true);
                  }}
                />
              </div>
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
                          successToast('Thread updated succesfully.');
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
      <Modal isOpen={imageModalShow}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Change thread picture</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => setImageModalShow(false)}
              />
            </div>
          </div>
          <div className="w-full flex-grow">
            <div>
              <img ref={cropArea} style={{ maxWidth: '100%', maxHeight: '500px' }} />
            </div>
            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => setImageModalShow(false)}
              >
                Cancel
              </button>
              <SubmitButton
                onClick={async () => {
                  const files = fileInput.current?.files;
                  if (files && files?.length > 0) {
                    const file = files[0];
                    const dimensions = cropper.current?.getData();
                    if (file && dimensions) {
                      if (!validProfilePictureUploadRegExp.test(file.type)) {
                        errorToast('Invalid image file uploaded');
                        return;
                      }
                      const { width, height, x, y } = dimensions;
                      if (width < 0 || height < 0 || x < 0 || y < 0) return;
                      const newImage = await uploadProfilePicture(
                        file,
                        {
                          height,
                          width,
                          left: x,
                          top: y
                        },
                        thread.id
                      );

                      if (newImage.id && profilePictureDisplay.current) {
                        setProfilePictureSrc(profilepApiURL + '/' + newImage.id);
                      }

                      setImageModalShow(false);
                    }
                  }
                }}
              >
                Save
              </SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditThreadModal;
