import { toast } from 'react-toastify';

export const errorToast = (message: string) =>
  toast.error(message, { position: 'bottom-right' });
