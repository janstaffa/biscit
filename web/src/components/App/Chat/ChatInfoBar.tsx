import { useState } from 'react';
import { BsFillInfoCircleFill, BsFillPeopleFill } from 'react-icons/bs';
import { MdEdit, MdPermMedia } from 'react-icons/md';
import {
  FileSnippetFragment,
  MeQuery,
  ThreadQuery,
  ThreadsQuery,
  useMeQuery,
  useThreadsQuery
} from '../../../generated/graphql';
import InfoBarTab from '../InfoBar/InfoBarTab';
export interface ChatInfoBarProps {
  show: boolean;
  thread: ThreadQuery | undefined;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
}

const ChatInfoBar: React.FC<ChatInfoBarProps> = ({ show, thread, setGalleryFile }) => {
  const [tab, setTab] = useState<number>(1);
  const meData = useMeQuery();
  const { data: threads } = useThreadsQuery();

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
        <div className="w-28 h-28 bg-white rounded-full mb-3"></div>
        <h3 className="text-xl text-light-200 text-center font-opensans">{thread?.thread.data?.name}</h3>
        {/* <p className="text-md text-light-300 text-center font-opensans">
          {thread?.thread.data?.isDm ? 'friends since ' : 'created '}:
          {thread?.thread.data?.createdAt ? formatTime(thread?.thread.data?.createdAt) : 'unknown'}
        </p> */}
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
          <BsFillPeopleFill
            size={28}
            className={
              'cursor-pointer' +
              (tab === 2 ? ' text-accent mx-2 hover:text-accent-hover' : ' text-light-400 mx-2 hover:text-light-200')
            }
            title="View all members of this thread."
            onClick={() => setTab(2)}
          />
          <BsFillInfoCircleFill
            size={28}
            className={
              'cursor-pointer' +
              (tab === 3 ? ' text-accent mx-2 hover:text-accent-hover' : ' text-light-400 mx-2 hover:text-light-200')
            }
            title="More info."
            onClick={() => setTab(3)}
          />
          <MdEdit
            size={28}
            className="cursor-pointer text-light-400 mx-2 hover:text-light-200"
            title="Edit this thread."
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        <InfoBarTab
          thread={thread}
          setGalleryFile={setGalleryFile}
          tab={tab}
          me={meData.data as MeQuery}
          myThreads={threads as ThreadsQuery | undefined}
        />
      </div>
    </div>
  );
};

export default ChatInfoBar;
