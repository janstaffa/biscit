import Cropper from 'cropperjs';
import { NextPage } from 'next';
import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { MdAddAPhoto } from 'react-icons/md';
import { Modal } from 'react-tiny-modals';
import '../../../../node_modules/cropperjs/dist/cropper.css';
import SettingsLayout from '../../../components/App/Settings/SettingsLayout';
import SubmitButton from '../../../components/Buttons/SubmitButton';
import { genericErrorMessage, profilepApiURL, validProfilePictureUploadRegExp } from '../../../constants';
import { useMeQuery, useUpdateSettingsMutation } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast, successToast } from '../../../utils/toasts';
import { uploadProfilePicture } from '../../../utils/uploadFile';
import withAuth from '../../../utils/withAuth';
const Settings: NextPage = () => {
  const { data: meData } = useMeQuery();

  const { mutate: updateSettings } = useUpdateSettingsMutation({
    onSuccess: (data) => {
      if (data.UserUpdateSettings.data) {
        successToast('Settings updated succesfully.');
      }
      if (data.UserUpdateSettings.errors.length > 0) {
        data.UserUpdateSettings.errors.forEach((err) => {
          errorToast(err.details?.message);
        });
        return;
      }
      queryClient.invalidateQueries('Me');
    },
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    }
  });

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [isHoveringFile, setIsHoveringFile] = useState<boolean>(false);
  const [imageModalShow, setImageModalShow] = useState<boolean>(false);
  const cropArea = useRef<HTMLImageElement | null>(null);

  const cropper = useRef<Cropper>();
  const profilePictureDisplay = useRef<HTMLImageElement | null>(null);

  const profilePictureId = meData?.me?.profile_picture?.id;
  const [profilePictureSrc, setProfilePictureSrc] = useState<string | undefined>();
  useEffect(() => {
    setProfilePictureSrc(profilePictureId && profilepApiURL + '/' + profilePictureId);
  }, [profilePictureId]);

  const [userDetails, setUserDetails] = useState<{
    username?: string;
    email?: string;
    setAsUnread?: boolean;
    allowThreads?: boolean;
    allowFriendRequests?: boolean;
    soundNotifications?: boolean;
  }>({});

  useEffect(() => {
    if (meData?.me) {
      const { email, username, setAsUnread, allowFriendRequests, allowThreads, soundNotifications } = meData.me;
      setUserDetails({ email, username, setAsUnread, allowFriendRequests, allowThreads, soundNotifications });
    }
  }, [meData]);

  const blinkScreen = useRef<HTMLDivElement | null>(null);
  return (
    <>
      <Head>
        <title>Biscit | Settings</title>
      </Head>
      <SettingsLayout>
        <div className="w-full h-full flex flex-row">
          <div className="w-64 bg-dark-300 text-light-300 flex flex-row justify-center pt-5">
            <ul className="w-auto text-lg list-none">
              <li>
                <a href="#account" className="text-light-300">
                  Account
                </a>
              </li>
              <li>
                <a href="#customization" className="text-light-300">
                  Customization
                </a>
              </li>
              <li>
                <a href="#notifications" className="text-light-300">
                  Notifications
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-light-300">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
          <div className="flex-grow px-5 overflow-y-scroll">
            <div id="account" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans mb-3">Account:</h2>
              <div className="mx-3">
                <div className="flex flex-row h-32">
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
                  <div className="flex flex-row justify-center items-center text-light-200 px-3">
                    <span className="text-xl">{meData?.me?.username}</span>
                    <span className="text-light-400 ml-2  text-base">#{meData?.me?.tag}</span>
                  </div>
                </div>
                <div className="w-2/5 mt-3">
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-username" className="text-light-300 text-md">
                      Username
                    </label>
                    <input
                      type="text"
                      name="settings-username"
                      className="w-full bg-dark-50 outline-none text-light-200 rounded-md px-3 py-1"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={userDetails.username}
                      onChange={(e) => setUserDetails({ ...userDetails, username: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-username" className="text-light-300 text-md">
                      Email
                    </label>
                    <input
                      type="text"
                      name="settings-email"
                      className="w-full bg-dark-50 outline-none text-light-200 rounded-md px-3 py-1"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div id="customization" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans mb-1">Customization:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={false}
                    onClick={() => {
                      const audio = new Audio('/you-are-an-idiot.mp3');
                      let counter = 0;
                      audio.play();
                      alert('YOU ARE AN IDIOT!');
                      const interval = setInterval(() => {
                        if (!blinkScreen.current) return;
                        let display;
                        if (counter % 2 === 0) {
                          display = 'none';
                        } else {
                          display = 'block';
                        }
                        blinkScreen.current.style.display = display;
                        counter++;
                      }, 100);
                      setTimeout(() => {
                        clearInterval(interval);
                        if (blinkScreen.current) blinkScreen.current.style.display = 'none';
                      }, 5000);
                    }}
                    title="Just don't. :)"
                  />
                  <div className="text-light-300 text-lg">Light mode</div>
                </div>
              </div>
            </div>
            <div id="notifications" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans mb-1">Notifications:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={userDetails.soundNotifications}
                    onChange={(e) => setUserDetails({ ...userDetails, soundNotifications: e.target.checked })}
                  />
                  <div className="text-light-300 text-lg">Sound notifications</div>
                </div>
                <div className="flex flex-row items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={userDetails.setAsUnread}
                    onChange={(e) => setUserDetails({ ...userDetails, setAsUnread: e.target.checked })}
                  />
                  <div className="text-light-300 text-lg">Set as unread when not present</div>
                </div>
              </div>
            </div>

            <div id="privacy" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans">Privacy:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={userDetails.allowFriendRequests}
                    onChange={(e) => {
                      setUserDetails({ ...userDetails, allowFriendRequests: e.target.checked });
                    }}
                  />
                  <div className="text-light-300 text-lg">Allowed to recieve friend requests</div>
                </div>
                <div className="flex flex-row items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={userDetails.allowThreads}
                    onChange={(e) => setUserDetails({ ...userDetails, allowThreads: e.target.checked })}
                  />
                  <div className="text-light-300 text-lg">Allowed to be added to threads</div>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-row justify-center items-center">
              <SubmitButton
                onClick={() => {
                  updateSettings({
                    options: {
                      newUsername: meData?.me?.username !== userDetails.username ? userDetails.username : null,
                      newEmail: meData?.me?.email !== userDetails.email ? userDetails.email : null,
                      allowFriendRequests:
                        meData?.me?.allowFriendRequests !== userDetails.allowFriendRequests
                          ? userDetails.allowFriendRequests
                          : null,
                      allowThreads:
                        meData?.me?.allowThreads !== userDetails.allowThreads ? userDetails.allowThreads : null,
                      setAsUnread: meData?.me?.setAsUnread !== userDetails.setAsUnread ? userDetails.setAsUnread : null,
                      soundNotifications:
                        meData?.me?.soundNotifications !== userDetails.soundNotifications
                          ? userDetails.soundNotifications
                          : null
                    }
                  });
                }}
              >
                Save
              </SubmitButton>
            </div>
          </div>
        </div>
      </SettingsLayout>
      <Modal isOpen={imageModalShow}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Change status</div>
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
                      const newImage = await uploadProfilePicture(file, {
                        height,
                        width,
                        left: x,
                        top: y
                      });

                      if (newImage.id && profilePictureDisplay.current) {
                        setProfilePictureSrc(profilepApiURL + '/' + newImage.id);
                        queryClient.invalidateQueries('Me');
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
      <div className="w-screen h-screen absolute top-0 left-0 bg-white z-50 hidden" ref={blinkScreen}></div>
    </>
  );
};

export default withAuth(Settings);
