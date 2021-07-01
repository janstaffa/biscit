import { useState } from 'react';
import { BsFillInfoCircleFill, BsFillPeopleFill } from 'react-icons/bs';
import { MdEdit, MdPermMedia } from 'react-icons/md';
import { profilepApiURL } from '../../../constants';
import {
  FileSnippetFragment,
  MeQuery,
  ThreadQuery,
  ThreadsQuery,
  useMeQuery,
  useThreadsQuery
} from '../../../generated/graphql';
import InfoBarTab from '../InfoBar/InfoBarTab';
import ProfilePicture from '../ProfilePicture';
export interface ChatInfoBarProps {
  show: boolean;
  thread: ThreadQuery | undefined;
  threadId: string;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
  setEditModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  setAddMemberModalShow: React.Dispatch<React.SetStateAction<boolean>>;
  editModalShow: boolean;
}

const ChatInfoBar: React.FC<ChatInfoBarProps> = ({
  show,
  thread,
  threadId,
  setGalleryFile,
  setEditModalShow,
  setAddMemberModalShow,
  editModalShow
}) => {
  const [tab, setTab] = useState<number>(1);
  const { data: meData } = useMeQuery();
  const { data: threads } = useThreadsQuery();

  const profilePictureId = thread?.thread.data?.thread_picture?.id;
  const profilePictureSrc = profilePictureId && profilepApiURL + '/' + profilePictureId;
  return (
    <div
      className="bg-dark-200 mt-12 border-l-2 border-dark-50 absolute right-0 overflow-x-hidden flex flex-col"
      style={{
        width: '350px',
        height: 'calc(100% - 3rem)',
        transition: 'margin 0.3s ease',
        marginRight: show ? '0' : '-350px'
      }}
    >
      <div
        className="w-full h-60 flex flex-col items-center p-5 border-b-2 border-dark-50"
        style={{ minHeight: '15rem' }}
      >
        <ProfilePicture src={profilePictureSrc} size="110px" className="mb-3" />
        <h3 className="text-xl text-light-200 text-center font-opensans">{thread?.thread.data?.name}</h3>
        <div className="mt-2 w-full flex flex-row justify-end">
          <MdPermMedia
            size={28}
            className={
              'cursor-pointer' +
              (tab === 1 ? ' text-accent mx-2 hover:text-accent-hover' : ' text-light-400 mx-2 hover:text-light-200')
            }
            title="View media sent in this thread."
            onClick={() => setTab(1)}
          />
          {!thread?.thread.data?.isDm && (
            <BsFillPeopleFill
              size={28}
              className={
                'cursor-pointer' +
                (tab === 2 ? ' text-accent mx-2 hover:text-accent-hover' : ' text-light-400 mx-2 hover:text-light-200')
              }
              title="View all members of this thread."
              onClick={() => setTab(2)}
            />
          )}
          <BsFillInfoCircleFill
            size={28}
            className={
              'cursor-pointer' +
              (tab === 3 ? ' text-accent mx-2 hover:text-accent-hover' : ' text-light-400 mx-2 hover:text-light-200')
            }
            title="More info."
            onClick={() => setTab(3)}
          />
          {!thread?.thread.data?.isDm && meData?.me?.id === thread?.thread.data?.creatorId && (
            <MdEdit
              size={28}
              className="cursor-pointer text-light-400 mx-2 hover:text-light-200"
              title="Edit this thread."
              onClick={() => setEditModalShow(!editModalShow)}
            />
          )}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        <InfoBarTab
          thread={thread}
          threadId={threadId}
          setGalleryFile={setGalleryFile}
          setAddMemberModalShow={setAddMemberModalShow}
          tab={tab}
          me={meData as MeQuery}
          myThreads={threads as ThreadsQuery | undefined}
        />
      </div>
    </div>
  );
};

export default ChatInfoBar;
