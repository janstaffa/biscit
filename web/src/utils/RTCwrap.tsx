import { ReactNode } from 'react';

export interface RTCwrapProps {
  children: ReactNode;
}

const RTCwrap: React.FC<RTCwrapProps> = ({ children }) => {
  return <>{children}</>;
};

export default RTCwrap;
