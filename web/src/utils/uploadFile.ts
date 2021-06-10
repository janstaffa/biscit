import { attachmentUploadURL, profilepUploadURL } from '../constants';
import { errorToast } from './toasts';

export const uploadAttachment = (file: File, threadId: string): Promise<{ id: string; name: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('threadId', threadId);

  return new Promise((resolve, reject) => {
    fetch(attachmentUploadURL, { method: 'POST', credentials: 'include', body: formData })
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

export const uploadProfilePicture = async (
  file: File,
  dimensions: { top: number; left: number; width: number; height: number }
): Promise<{ id: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('dimensions', JSON.stringify(dimensions));
  return new Promise((resolve, reject) => {
    fetch(profilepUploadURL, { method: 'POST', credentials: 'include', body: formData })
      .then((response) => response.json())
      .then((data) => {
        const response = data;
        if (response.error) {
          errorToast(response.error);
          return;
        }
        if (response.fileId) {
          resolve({ id: response.fileId });
        }
      });
  });
};
