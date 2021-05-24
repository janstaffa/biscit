import { ReactNode, useEffect, useRef } from 'react';
import { fileApiURL, imageRegExp } from '../../../constants';
import { FileSnippetFragment } from '../../../generated/graphql';

export interface ImageGalleryProps {
  file: FileSnippetFragment;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ file, setGalleryFile }) => {
  let display: ReactNode;

  if (file.format) {
    if (imageRegExp.test(file.format)) {
      display = (
        <div>
          <img
            src={fileApiURL + '/' + file.id}
            className="m-1"
            height="432px"
            style={{ maxWidth: '768px', height: '432px' }}
            alt={file.fileName}
          />
        </div>
      );
    }
  }

  const gallery = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.addEventListener('click', (e) => {
      if (e.target === gallery.current) {
        setGalleryFile(null);
      }
    });
  }, []);
  return (
    <div
      className={'w-full h-full absolute top-0 left-0 flex flex-col justify-center items-center select-none z-30'}
      style={{ backgroundColor: 'rgba(0,0,0, 0.8)' }}
      ref={gallery}
    >
      <div>{display}</div>
    </div>
  );
};

export default ImageGallery;
