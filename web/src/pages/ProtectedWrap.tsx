import { ReactNode, useEffect } from 'react';
import { useMeQuery, useTokenQuery } from '../generated/graphql';
import { useTokenStore } from '../stores/useTokenStore';
import { IncomingRequestAcceptMessage, IncomingSocketChatMessage } from '../types';
import { queryClient } from '../utils/createQueryClient';
import { socket } from '../utils/createWSconnection';
import RTCProvider from '../utils/RTCProvider';
import { infoToast } from '../utils/toasts';

export interface ProtectedWrapProps {
  children: ReactNode;
}

const ProtectedWrap: React.FC<ProtectedWrapProps> = ({ children }) => {
  const { data: token } = useTokenQuery();
  const { data: meData } = useMeQuery();

  const { setToken } = useTokenStore();

  useEffect(() => {
    if (token?.token) {
      setToken(token.token);
    }
  }, [token]);

  const handleMessage = (e) => {
    const audio = new Audio('/notification.mp3');

    const { data: m } = e;
    const incoming = JSON.parse(m);

    if (incoming.code === 3000) {
      const { message } = incoming as IncomingSocketChatMessage;
      if (meData?.me?.soundNotifications && message.userId !== meData?.me?.id)
        audio.play().catch((err) => console.error(err));
    } else if (incoming.code === 3017) {
      const { userId, username } = incoming as IncomingRequestAcceptMessage;
      infoToast(`${username} has accepted your friend request.`);
      queryClient.invalidateQueries('Me');
    }
  };
  useEffect(() => {
    const isAuth = !!meData?.me?.id;
    if (isAuth) {
      const ws = socket.connect();
      if (meData && ws) {
        ws.addEventListener('message', handleMessage);
        return () => ws?.removeEventListener('message', handleMessage);
      }
    }
  }, [meData]);

  useEffect(() => {
    socket.connect();

    window.addEventListener('focus', () => socket.connect());

    return () => {
      window.removeEventListener('focus', () => socket.connect());
    };
  }, []);

  return (
    <>
      <RTCProvider>{children}</RTCProvider>
    </>
  );
};

export default ProtectedWrap;
