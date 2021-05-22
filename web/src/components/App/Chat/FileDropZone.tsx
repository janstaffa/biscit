// export interface FileDropZoneProps {}

import { useEffect, useRef, useState } from 'react';
import { attachment } from '../../..';
import { errorToast } from '../../../utils/toasts';
import { uploadFile } from '../../../utils/uploadFile';

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

  const handleDrop = async (e: DragEvent) => {
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
          const newAttachment = await uploadFile(item);
          // only displays one attachment in AttachmentBar when uploading multiple files, attachmentRef.current
          setAttachments([...attachments, newAttachment]);
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
        'w-full absolute border-dashed border-2  flex flex-col justify-center items-center cursor-pointer z-10' +
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
