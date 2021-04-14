import Head from 'next/head';
import React, { useState } from 'react';
import FriendsLayout from '../../../components/App/FriendsLayout';
import { useSendRequestMutation } from '../../../generated/graphql';
import { errorToast, successToast } from '../../../utils/toasts';
import withAuth from '../../../utils/withAuth';
export interface AddFriendProps {}

const AddFriend: React.FC<AddFriendProps> = () => {
  const { mutate: sendRequest } = useSendRequestMutation({
    onError: (err) => {
      console.error(err);
      errorToast('Something went wrong, please try again later.');
    },
  });

  const [usernameInput, setUsernameInput] = useState<string>('');
  return (
    <>
      <Head>
        <title>Biscit | Add a friend</title>
      </Head>
      <FriendsLayout>
        <div className="flex flex-col w-full h-full">
          <div className="pt-12 w-full">
            <div className="w-full h-48 bg-dark-200 px-10 flex flex-col justify-center items-center">
              <div className="w-full max-w-xl h-auto">
                <p className="text-light-200 text-base uppercase font-roboto px-1 py-1">
                  Add a friend
                </p>
                <p className="text-light-300 my-1">
                  Type in the username of the person, you wan't to add.
                </p>
                <div className="flex flex-row">
                  <input
                    type="text"
                    className="w-full h-10 outline-none px-4 bg-dark-50 rounded-l-md text-light-200 font-roboto"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    list="users_datalist"
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                  <datalist id="users_datalist">
                    <option value="John" />
                    <option value="Babel" />
                    <option value="George" />
                  </datalist>
                  <button
                    className="bg-accent px-3 hover:bg-accent-hover rounded-r-md text-dark-200 hover:text-dark-100 font-opensans font-bold"
                    onClick={async () => {
                      await sendRequest(
                        { options: { username: usernameInput } },
                        {
                          onSuccess: (data) => {
                            if (data.FriendRequestSend.errors) {
                              const message =
                                data.FriendRequestSend.errors[0]?.details
                                  ?.message;

                              if (message) {
                                errorToast(message);
                              }
                            } else {
                              console.log(
                                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                                data.FriendRequestSend.data
                              );
                              if (data.FriendRequestSend.data) {
                                successToast('Friends request sent.');
                              } else {
                                errorToast(
                                  'Something went wrong, please try again later.'
                                );
                              }
                            }
                          },
                        }
                      );
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-grow">
            <div className="w-full h-full absolute">
              <img
                src="/all_splash.svg"
                alt="Pending splash image"
                className="w-1/3 max-w-4xl opacity-20 mx-auto mt-20"
              />
            </div>
          </div>
        </div>
      </FriendsLayout>
    </>
  );
};

export default withAuth(AddFriend);
