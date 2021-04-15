import { ReactNode, useEffect, useState } from 'react';

export interface ModalProps {
  active: boolean;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ children, active = false }) => {
  const [show, setShow] = useState<boolean>(active);
  useEffect(() => {
    setShow(active);
  }, [active]);

  return show ? (
    <div
      className="w-full h-full absolute z-30 top-0 flex flex-col justify-center items-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
    >
      <div className="w-96 h-auto bg-dark-300 rounded-xl relative z-40 flex flex-col p-5">
        {children}
      </div>
    </div>
  ) : null;
};

export default Modal;
