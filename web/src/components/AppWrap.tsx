import { ReactNode, useEffect } from 'react';
import { IncomingSocketChatMessage } from '..';
import { useMeQuery } from '../generated/graphql';
import { socket } from '../utils/createWSconnection';

export interface AppWrapProps {
  children: ReactNode;
}

const AppWrap: React.FC<AppWrapProps> = ({ children }) => {
  const { data: meData } = useMeQuery();

  const handleMessage = (e) => {
    const audio = new Audio('/notification.mp3');

    const { data: m } = e;
    const incoming = JSON.parse(m);

    if (incoming.code === 3000) {
      const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;
      console.log(message.userId, meData);
      if (message.userId !== meData?.me?.id) audio.play();
    }
  };
  useEffect(() => {
    const ws = socket.connect();
    if (meData && ws) {
      ws.addEventListener('message', handleMessage);
      return () => ws?.removeEventListener('message', handleMessage);
    }
  }, [meData]);
  return <>{children}</>;
};

export default AppWrap;
