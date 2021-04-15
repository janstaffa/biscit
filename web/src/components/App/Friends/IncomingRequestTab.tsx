import React from 'react';
import { FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';
import { genericErrorMessage } from '../../../constants';
import {
  FriendRequest,
  useAcceptRequestMutation,
  User,
} from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast, successToast } from '../../../utils/toasts';
export interface IncomingRequestTabProps {
  request: Pick<FriendRequest, 'id' | 'createdAt'> & {
    sender: Pick<User, 'id' | 'username' | 'email' | 'status' | 'bio'>;
  };
}

const IncomingRequestTab: React.FC<IncomingRequestTabProps> = ({
  request: { id, sender, createdAt },
}) => {
  const { mutate: acceptRequest } = useAcceptRequestMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    },
    onSuccess: (data) => {
      if (data.FriendRequestAccept.errors.length > 0) {
        const message = data.FriendRequestAccept.errors[0]?.details?.message;
        if (message) {
          errorToast(message);
        }
      } else {
        if (!data.FriendRequestAccept.data) {
          errorToast(genericErrorMessage);
        } else {
          successToast('Success.');
        }
        queryClient.invalidateQueries('Me');
      }
    },
  });

  return (
    <div className="w-full h-16 bg-dark-100 hover:bg-dark-50">
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <div className="w-11 h-11 rounded-full bg-light"></div>
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">{sender.username}</div>
              <div className="text-light-300 w-full font-roboto text-sm truncate">
                {sender.bio || sender.status}
              </div>
            </div>
            <div className="flex flex-row items-center">
              <FaRegCheckCircle
                className="text-green-500 text-3xl mx-2 hover:text-green-400"
                title="Accept"
                onClick={async () => {
                  await acceptRequest({
                    options: { requestId: id, value: true },
                  });
                }}
              />
              <FaRegTimesCircle
                className="text-red-500 text-3xl mx-2 hover:text-red-400"
                title="Decline"
                onClick={async () => {
                  await acceptRequest({
                    options: { requestId: id, value: false },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingRequestTab;
