import React, { ReactNode } from 'react';
import { RTCcontext } from '../../utils/RTCProvider';
import CallingDialog from './Chat/CallingDialog';
import LeftSidebar from './LeftSidebar';
import Navbar from './Navbar';
interface LayoutProps {
  threadId?: string;
  children: ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children, threadId }) => {
  return (
    <div>
      <div className="bg-dark-100 flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-row flex-1 overflow-hidden">
          <LeftSidebar threadId={threadId} />
          <div className="flex-1 relative">
            <RTCcontext.Consumer>
              {(value) => {
                if (!value) return;

                if (value.isRinging && value.ringingDetails) {
                  return (
                    <CallingDialog
                      callId={value.ringingDetails.callId}
                      user={value.ringingDetails.user}
                      thread={value.ringingDetails.thread}
                    />
                  );
                }
              }}
            </RTCcontext.Consumer>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
