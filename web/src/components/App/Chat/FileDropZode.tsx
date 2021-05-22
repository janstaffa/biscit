// export interface FileDropZoneProps {}

import { useEffect, useRef, useState } from 'react';
import { fileUploadURL } from '../../../constants';

const FileDropZone: React.FC = () => {
  const dropZone = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const highlightDropZone = (e) => {
    e.preventDefault();
    setIsHighlighted(true);
  };
  const unHighlightDropZone = (e) => {
    e.preventDefault();
    setIsHighlighted(false);
  };
  const handleClick = (e) => {
    console.log('click');
    setIsHighlighted(false);
    fileInput.current?.click();
  };
  const handleUpload = (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      console.log(files);
      formData.append('files', file);
    });
    fetch(fileUploadURL, { method: 'POST', credentials: 'include', body: formData })
      .then((response) => response.json())
      .then((data) => console.log('succes' + data))
      .catch((error) => {
        console.error('Error:', error);
      });
  };
  const handleDrop = (e: DragEvent) => {
    unHighlightDropZone(e);
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (!files) return;

    handleUpload(files);
  };
  const getFiles = (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files) return;
    handleUpload(files);
  };
  useEffect(() => {
    if (dropZone.current) {
      dropZone.current.addEventListener('dragenter', highlightDropZone, false);
      dropZone.current.addEventListener('dragleave', unHighlightDropZone, false);
      dropZone.current.addEventListener('dragover', highlightDropZone, false);
      dropZone.current.addEventListener('drop', handleDrop, false);
      dropZone.current.addEventListener('click', handleClick, false);
      fileInput.current?.addEventListener('change', getFiles, false);
    }

    return () => {
      if (dropZone.current) {
        dropZone.current.removeEventListener('dragenter', highlightDropZone, false);
        dropZone.current.removeEventListener('dragleave', unHighlightDropZone, false);
        dropZone.current.removeEventListener('dragover', highlightDropZone, false);
        dropZone.current.removeEventListener('drop', handleDrop, false);
        dropZone.current.removeEventListener('click', handleClick, false);
        fileInput.current?.removeEventListener('change', getFiles, false);
      }
    };
  }, []);
  return (
    <div
      className={
        'w-full h-52 border-dashed border-2  flex flex-col justify-center items-center cursor-pointer' +
        (isHighlighted ? ' border-accent-hover bg-dark-100' : ' border-accent bg-dark-50')
      }
      ref={dropZone}
    >
      <span className="text-light-300 font-opensans">Drag and drop files to upload them.</span>
      <input type="file" className="hidden" ref={fileInput} multiple />
    </div>
  );
};

export default FileDropZone;
