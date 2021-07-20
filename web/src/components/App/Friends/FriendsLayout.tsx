import React, { ReactNode, useEffect, useState } from 'react';
import { BsFillPersonPlusFill } from 'react-icons/bs';
import { FaUserFriends } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Modal } from 'react-tiny-modals';
import { currentUrl, genericErrorMessage } from '../../../constants';
import { useMeQuery, useSendRequestMutation } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast, successToast } from '../../../utils/toasts';
import NavLink from '../../Buttons/NavLink';
import SubmitButton from '../../Buttons/SubmitButton';
import ContentNav from '../ContentNav';
import Layout from '../Layout';

export interface FriendsLayoutProps {
  children: ReactNode;
}

const FriendsLayout: React.FC<FriendsLayoutProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>();

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  const [modalShow, setModalShow] = useState<boolean>(false);
  const [newFriendInput, setNewFriendInput] = useState<string>('');

  const { mutate: sendRequest } = useSendRequestMutation();
  const { data: meData } = useMeQuery();
  const requests = meData?.me?.friend_requests;

  const hasPendingRequests =
    (requests?.incoming && requests?.incoming.length > 0) || (requests?.outcoming && requests?.outcoming.length > 0);
  return (
    <>
      <Layout>
        <ContentNav>
          <div className="flex flex-row items-center justify-between h-full select-none">
            <div className="flex flex-row items-center">
              <div className="border-r border-light-300 px-4 mr-2">
                <FaUserFriends className="text-light-300 text-2xl" />
              </div>
              <NavLink href="/app/friends/all" active={currentPath === '/app/friends/all'}>
                All
              </NavLink>
              <NavLink href="/app/friends/online" active={currentPath === '/app/friends/online'}>
                Online
              </NavLink>
              <NavLink href="/app/friends/pending" active={currentPath === '/app/friends/pending'}>
                <div className="flex flex-row justify-center items-center">
                  Pending {hasPendingRequests && <div className="w-2 h-2 bg-accent rounded-full ml-2"></div>}
                </div>
              </NavLink>
            </div>
            <div
              className={
                'text-lime-200 font-bold mx-1 p-1.5 rounded-full cursor-pointer ml-5' +
                (currentPath === '/app/friends/add' ? ' bg-dark-50' : ' hover:bg-dark-50 bg-dark-100')
              }
              onClick={() => setModalShow(true)}
            >
              <BsFillPersonPlusFill size={20} />
            </div>
          </div>
        </ContentNav>
        <div className="w-full h-full overflow-hidden relative">{children} </div>
      </Layout>
      <Modal isOpen={modalShow} backOpacity={0.5}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Send a friend request</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => setModalShow(false)}
              />
            </div>
          </div>
          <div className="w-full flex-grow">
            <div className="my-2">
              <p className="text-light-400 font-opensans text-sm mb-1">
                Enter the username of the person you want to add followed by his tag.
              </p>
              <input
                type="text"
                className="w-full h-9 rounded-md bg-dark-100 focus:bg-dark-50 outline-none px-3 text-light-200"
                placeholder="babel#123456"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={100}
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
              />
            </div>
            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => setModalShow(false)}
              >
                Cancel
              </button>
              <SubmitButton
                onClick={() => {
                  if (!newFriendInput || !/\S/.test(newFriendInput)) return;
                  if (!newFriendInput.includes('#')) {
                    errorToast('You must include a # before the users tag.');
                    return;
                  }

                  const inputArr = newFriendInput.split('#');
                  if (
                    inputArr.length <= 1 ||
                    !/[0-9]/.test(inputArr[inputArr.length - 1]) ||
                    inputArr[inputArr.length - 1].length !== 6
                  ) {
                    errorToast('Invalid format. Please try again.');
                    return;
                  }
                  sendRequest(
                    { options: { usernameAndTag: newFriendInput } },
                    {
                      onSuccess: (data) => {
                        if (data.FriendRequestSend.errors.length > 0) {
                          data.FriendRequestSend.errors.forEach((err) => {
                            errorToast(err.details?.message);
                          });
                          return;
                        } else {
                          if (data.FriendRequestSend.data) {
                            successToast(`Friends request sent to ${newFriendInput}.`);
                            queryClient.invalidateQueries('Me');
                          } else {
                            errorToast(genericErrorMessage);
                          }
                        }
                        setModalShow(false);
                        setNewFriendInput('');
                      }
                    }
                  );
                }}
              >
                Send
              </SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FriendsLayout;
