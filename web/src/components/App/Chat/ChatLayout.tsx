import React, { ReactNode } from 'react';
import { FaHashtag } from 'react-icons/fa';
import ContentNav from '../ContentNav';
import Layout from '../Layout';

export interface ChatLayoutProps {
  children: ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <Layout>
      <ContentNav>
        <div className="flex flex-row items-center h-full select-none">
          <div className="border-r border-light-300 px-4 mr-2">
            <FaHashtag className="text-light-300 text-2xl" />
          </div>
          <div className="text-light-200 text-lg font-bold font-opensans">
            Faraon
          </div>
        </div>
      </ContentNav>
      <div className="w-full h-full overflow-hidden relative flex flex-col">
        {children}
      </div>
    </Layout>
  );
};

export default ChatLayout;
