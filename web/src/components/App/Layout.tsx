import React, { ReactNode, useEffect, useState } from 'react';
import { isPhone } from '../../constants';
import { RTCcontext } from '../../utils/RTCProvider';
import CallingDialog from './Chat/CallingDialog';
import LeftSidebar from './LeftSidebar';
import Navbar from './Navbar';

interface LayoutProps {
  threadId?: string;
  children: ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children, threadId }) => {
  const defaultIsOpen = !isPhone;

  const [isOpen, setIsOpen] = useState<boolean>(defaultIsOpen);

  const changeIsOpen = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    let xDown: number | null = null;
    let yDown: number | null = null;

    const getTouches = (e) => {
      return e.touches || e.originalEvent.touches;
    };

    const handleTouchStart = (evt) => {
      const firstTouch = getTouches(evt)[0];
      xDown = firstTouch.clientX;
      yDown = firstTouch.clientY;
    };

    const handleTouchMove = (evt) => {
      if (!xDown || !yDown) {
        return;
      }

      const xUp = evt.touches[0].clientX;
      const yUp = evt.touches[0].clientY;

      const xDiff = xDown - xUp;
      const yDiff = yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
      } else {
        if (yDiff > 0) {
          console.log('up');
        } else {
          console.log('down');
        }
      }

      xDown = null;
      yDown = null;
    };
    if (isPhone) {
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchmove', handleTouchMove, false);
    }

    const checkScreenSize = () => {
      if (window.innerWidth > 728) {
        setIsOpen(true);
      }
    };
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      document.removeEventListener('touchstart', handleTouchStart, false);
      document.removeEventListener('touchmove', handleTouchMove, false);
    };
  }, []);
  return (
    <div>
      <div className="bg-dark-100 flex flex-col h-screen">
        <Navbar changeIsOpen={changeIsOpen} />
        <div className="flex flex-row flex-1 overflow-hidden">
          <LeftSidebar threadId={threadId} isOpen={isOpen} />
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
