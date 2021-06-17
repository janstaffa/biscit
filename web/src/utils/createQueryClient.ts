import { QueryClient } from 'react-query';
import { genericErrorMessage } from '../constants';
import { errorToast } from './toasts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      }
    }
  }
});
