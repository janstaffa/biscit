import { toast } from 'react-toastify';

export const errorToast = (message: string) =>
  toast.error(message, { position: 'bottom-right' });

export const successToast = (message: string) =>
  toast.success(message, {
    position: 'bottom-right',
    className: 'bg-lime-100',
  });
