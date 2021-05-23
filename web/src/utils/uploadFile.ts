import { fileUploadURL } from '../constants';
import { errorToast } from './toasts';

export const uploadFile = (file: File, threadId: string): Promise<{ id: string; name: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threadId', threadId);
  // send the threadId to validate future get requests
  return new Promise((resolve, reject) => {
    fetch(fileUploadURL, { method: 'POST', credentials: 'include', body: formData })
      .then((response) => response.json())
      .then((data) => {
        const response = data;
        if (response.error) {
          errorToast(response.error);
          return;
        }
        if (response.fileId) {
          resolve({ id: response.fileId, name: file.name });
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
};
