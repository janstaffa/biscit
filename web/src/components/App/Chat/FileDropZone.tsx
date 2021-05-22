// export interface FileDropZoneProps {}

import { useEffect, useRef, useState } from 'react';
import { attachment } from '../../..';
import { fileUploadURL } from '../../../constants';
import { errorToast } from '../../../utils/toasts';

export interface FileDropZoneProps {
  attachments: attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<attachment[]>>;
}
const FileDropZone: React.FC<FileDropZoneProps> = ({ attachments, setAttachments }) => {
  const dropZone = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const highlightDropZone = (e: DragEvent) => {
    e.preventDefault();
    setIsHighlighted(true);
  };
  const unHighlightDropZone = (e) => {
    e.preventDefault();
    setIsHighlighted(false);
  };

  const handleUpload = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // send the threadId to validate future get requests
    fetch(fileUploadURL, { method: 'POST', credentials: 'include', body: formData })
      .then((response) => response.json())
      .then((data) => {
        const response = data;
        if (response.error) {
          errorToast(response.error);
          return;
        }
        if (response.fileId) {
          setAttachments([...attachments, { id: response.fileId, name: file.name }]);
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const handleDrop = (e: DragEvent) => {
    unHighlightDropZone(e);
    const dt = e.dataTransfer;
    if (dt?.items) {
      const items = dt.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i].getAsFile();
        if (item) {
          if (!item.type) {
            errorToast('Only valid files are accepted.');
            return;
          }
          handleUpload(item);
        }
      }
    }
  };

  useEffect(() => {
    if (dropZone.current) {
      dropZone.current.addEventListener('dragenter', highlightDropZone, false);
      dropZone.current.addEventListener('dragleave', unHighlightDropZone, false);
      dropZone.current.addEventListener('dragover', highlightDropZone, false);
      dropZone.current.addEventListener('drop', handleDrop, false);
    }
    return () => {
      if (dropZone.current) {
        dropZone.current.removeEventListener('dragenter', highlightDropZone, false);
        dropZone.current.removeEventListener('dragleave', unHighlightDropZone, false);
        dropZone.current.removeEventListener('dragover', highlightDropZone, false);
        dropZone.current.removeEventListener('drop', handleDrop, false);
      }
    };
  }, []);
  return (
    <div
      className={
        'w-full absolute border-dashed border-2  flex flex-col justify-center items-center cursor-pointer' +
        (isHighlighted ? ' border-accent-hover' : ' border-accent')
      }
      style={{ height: 'calc(100% - 144px)', top: '48px', backgroundColor: 'rgba(21,25,32, 0.8)' }}
      ref={dropZone}
    >
      <span className="text-light-300 font-opensans">Drag and drop files to upload them.</span>
      <input type="file" className="hidden" ref={fileInput} multiple />
    </div>
  );
};

export default FileDropZone;
