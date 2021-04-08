import { useState } from 'react';
import { FaSearch, FaUserFriends } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';
import TabButton from './Sidebar/TabButton';
import ThreadButton from './Sidebar/ThreadButton';

export interface LeftSidebarProps {}

const LeftSidebar: React.FC<LeftSidebarProps> = () => {
  const [activeTab, setActiveTab] = useState<string>();

  return (
    <div className="h-full w-96 bg-dark-200 border-r-2 border-dark-50">
      <div className="w-full h-auto border-b-2 border-dark-50 px-10 py-5">
        <TabButton
          onClick={() => setActiveTab('friends')}
          active={activeTab === 'friends'}
        >
          <FaUserFriends className="mr-4" />
          Friends
        </TabButton>
        <TabButton
          onClick={() => setActiveTab('threads')}
          active={activeTab === 'threads'}
        >
          <HiUserGroup className="mr-4" />
          Threads
        </TabButton>
      </div>

      <div className="h-16 w-full px-5 flex flex-col justify-center border-b border-dark-50">
        <div className="w-full h-9 flex flex-row">
          <input
            type="text"
            id="thread-search"
            className="w-full bg-dark-50 outline-none text-light-200 rounded-tl-xl rounded-bl-xl px-3"
          />
          <div
            className="w-10 flex flex-col justify-center items-center bg-dark-50 text-light-200 rounded-tr-xl rounded-br-xl"
            onClick={() => document.getElementById('thread-search')?.focus()}
          >
            <FaSearch />
          </div>
        </div>
      </div>
      <div className="h-auto p-2">
        <ThreadButton
          username="janstaffa"
          time="10:00"
          latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          undread={true}
          active={true}
        />
        <ThreadButton
          username="janstaffa"
          time="10:00"
          latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          undread={true}
        />
        <ThreadButton
          username="janstaffa"
          time="10:00"
          latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          undread={true}
        />
        <ThreadButton
          username="janstaffa"
          time="10:00"
          latestMessage="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          undread={true}
        />
      </div>
      <div></div>
    </div>
  );
};

export default LeftSidebar;
