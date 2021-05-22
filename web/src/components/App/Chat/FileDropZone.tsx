// export interface FileDropZoneProps {}

import { useEffect, useRef, useState } from 'react';
import { fileUploadURL } from '../../../constants';

const FileDropZone: React.FC = () => {
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
  const handleClick = (e) => {
    setIsHighlighted(false);
    fileInput.current?.click();
  };
  const handleUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const formData = new FormData();
      formData.append('file', file);
      fetch(fileUploadURL, { method: 'POST', credentials: 'include', body: formData })
        .then((response) => response.json())
        .then((data) => console.log('succes' + JSON.stringify(data)))
        .catch((error) => {
          console.error('Error:', error);
        });

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener('load', (e) => {
        const img = document.createElement('img');
        if (reader.result) {
          let parsedResult: string;
          if (Buffer.isBuffer(reader.result)) {
            parsedResult = String.fromCharCode.apply(null, new Uint16Array(reader.result));
          } else {
            parsedResult = reader.result as string;
          }
          img.classList.add('w-20', 'h-20');
          img.src = parsedResult;
          // if (preview.current) {
          //   preview.current.innerHTML = '';
          //   preview.current?.append(img);
          // }
        }
      });
    });
  };
  const handleDrop = (e: DragEvent) => {
    unHighlightDropZone(e);
    const dt = e.dataTransfer;
    const files = dt?.files;
    if (!files) return;

    handleUpload(files);
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
