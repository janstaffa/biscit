import React from 'react';
import { FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';
import { genericErrorMessage, profilepApiURL } from '../../../constants';
import { FriendRequest, useAcceptRequestMutation, UserSnippetFragment } from '../../../generated/graphql';
import { queryClient } from '../../../utils/createQueryClient';
import { errorToast, successToast } from '../../../utils/toasts';
import ProfilePicture from '../ProfilePicture';
export interface IncomingRequestTabProps {
  request: Pick<FriendRequest, 'id' | 'createdAt'> & {
    sender: UserSnippetFragment;
  };
}

const IncomingRequestTab: React.FC<IncomingRequestTabProps> = ({ request: { id, sender, createdAt } }) => {
  const { mutate: acceptRequest } = useAcceptRequestMutation({
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
        queryClient.invalidateQueries('Threads');
      }
    }
  });

  const profilePictureId = sender.profile_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;
  return (
    <div className="w-full h-16 bg-dark-100 hover:bg-dark-50">
      <div className="w-full h-full flex flex-row items-center cursor-pointer py-2">
        <div className="w-16 h-full flex flex-col justify-center items-center">
          <ProfilePicture size={44} src={profilePictureSrc} online={sender.status === 'online'} />
        </div>
        <div className="w-full flex-1 px-2">
          <div className="flex flex-row w-full justify-between">
            <div className="flex flex-col justify-center items-start">
              <div className=" text-light font-roboto">{sender.username}</div>
              <div className="text-light-300 w-full font-roboto text-sm truncate">{sender.bio || sender.status}</div>
            </div>
            <div className="flex flex-row items-center">
              <FaRegCheckCircle
                className="text-green-500 text-3xl mx-2 hover:text-green-400"
                title="Accept"
                onClick={async () => {
                  await acceptRequest({
                    options: { requestId: id, value: true }
                  });
                }}
              />
              <FaRegTimesCircle
                className="text-red-500 text-3xl mx-2 hover:text-red-400"
                title="Decline"
                onClick={async () => {
                  await acceptRequest({
                    options: { requestId: id, value: false }
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
