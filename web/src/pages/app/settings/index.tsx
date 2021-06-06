import Cropper from 'cropperjs';
import { NextPage } from 'next';
import React, { useRef, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { MdAddAPhoto } from 'react-icons/md';
import { Modal } from 'react-tiny-modals';
import '../../../../node_modules/cropperjs/dist/cropper.css';
import SettingsLayout from '../../../components/App/Settings/SettingsLayout';
import SubmitButton from '../../../components/Buttons/SubmitButton';
import { profilepApiURL } from '../../../constants';
import { useMeQuery } from '../../../generated/graphql';
import { errorToast } from '../../../utils/toasts';
import { uploadProfilePicture } from '../../../utils/uploadFile';
import withAuth from '../../../utils/withAuth';
const Settings: NextPage = () => {
  const { data: meData } = useMeQuery();

  const fileInput = useRef<HTMLInputElement | null>(null);
  const [isHoveringFile, setIsHoveringFile] = useState<boolean>(false);
  const [imageModalShow, setImageModalShow] = useState<boolean>(false);
  const cropArea = useRef<HTMLImageElement | null>(null);

  const cropper = useRef<Cropper>();
  const profilePictureDisplay = useRef<HTMLImageElement | null>(null);

  return (
    <>
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
              <li>
                <a href="#communication" className="text-light-300">
                  Communication
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
                    className="w-32 h-32 bg-white rounded-full cursor-pointer"
                    onClick={() => fileInput.current?.click()}
                    onMouseOver={() => setIsHoveringFile(true)}
                    onMouseLeave={() => setIsHoveringFile(false)}
                  >
                    <img className="w-full h-full rounded-full" ref={profilePictureDisplay} />
                    <div
                      className="w-full h-full rounded-full  flex-col items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: isHoveringFile ? 'flex' : 'none' }}
                    >
                      <MdAddAPhoto size={30} className="text-dark-50" />
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInput}
                      accept=".jpeg,.png,.webp,.avif,.tiff,.gif,.svg"
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
                              aspectRatio: 1 / 1
                            });
                          }
                        };
                        setImageModalShow(true);
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center items-center  text-xl text-light-200 px-3">
                    {meData?.me?.username}
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
                      value={meData?.me?.username}
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
                      value={meData?.me?.email}
                    />
                  </div>
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-phone" className="text-light-300 text-md">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="settings-phone"
                      className="w-full bg-dark-50 outline-none text-light-200 rounded-md px-3 py-1"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      // value={meData?.me?.username}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div id="customization" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans mb-1">Customization:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input type="checkbox" className="mr-2" />
                  <div className="text-light-300 text-lg">Light mode</div>
                </div>
              </div>
            </div>
            <div id="notifications" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans mb-1">Notifications:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input type="checkbox" className="mr-2" />
                  <div className="text-light-300 text-lg">Sound notifications</div>
                </div>
                <div className="flex flex-row items-center">
                  <input type="checkbox" className="mr-2" />
                  <div className="text-light-300 text-lg">Set as unread when not present</div>
                </div>
              </div>
            </div>

            <div id="privacy" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans">Privacy:</h2>
              <div className="mx-3">
                <div className="flex flex-row items-center">
                  <input type="checkbox" className="mr-2" />
                  <div className="text-light-300 text-lg">Allowed to recieve friend requests</div>
                </div>
                <div className="flex flex-row items-center">
                  <input type="checkbox" className="mr-2" />
                  <div className="text-light-300 text-lg">Allowed to be added to threads</div>
                </div>
              </div>
            </div>

            <div id="communication" className="w-full h-auto bg-dark-200 rounded-lg my-5 p-3">
              <h2 className="text-light-300 text-lg font-opensans">Communication:</h2>
              <div className="mx-3">
                <div className="w-2/5">
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-volume" className="text-light-300 text-md">
                      Master volume
                    </label>
                    <input name="settings-volume" type="range" className="w-full" />
                  </div>
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-mic" className="text-light-300 text-md">
                      Microphone
                    </label>
                    <select name="settings-mic" className="outline-none">
                      <option value="">Microphone 1</option>
                      <option value="">Microphone 2</option>
                      <option value="">Microphone 3</option>
                      <option value="">Microphone 4</option>
                    </select>
                  </div>
                  <div className="flex flex-col py-1">
                    <label htmlFor="settings-mic" className="text-light-300 text-md">
                      Camera
                    </label>
                    <select name="settings-mic" className="outline-none">
                      <option value="">Camera 1</option>
                      <option value="">Camera 2</option>
                      <option value="">Camera 3</option>
                      <option value="">Camera 4</option>
                    </select>
                  </div>
                </div>
              </div>
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
                  console.log(cropper.current?.getData());
                  const files = fileInput.current?.files;
                  if (files && files?.length > 0) {
                    const file = files[0];
                    const dimensions = cropper.current?.getData();
                    if (file && dimensions) {
                      const { width, height, x, y } = dimensions;
                      if (width < 0 || height < 0 || x < 0 || y < 0) return;
                      const newImage = await uploadProfilePicture(file, {
                        height,
                        width,
                        left: x,
                        top: y
                      });

                      if (newImage.id && profilePictureDisplay.current) {
                        profilePictureDisplay.current.src = profilepApiURL + '/' + newImage.id;
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

export default withAuth(Settings);
