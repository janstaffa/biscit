import React, { ReactNode, useRef } from 'react';
import { FaRegFile, FaRegFileAlt, FaRegFileExcel, FaRegFilePdf } from 'react-icons/fa';
import { HiDownload } from 'react-icons/hi';
import {
  audioRegExp,
  documentRegExp,
  fileApiURL,
  imageRegExp,
  pdfRegExp,
  sheetRegExp,
  videoRegExp
} from '../../../constants';
import { FileSnippetFragment } from '../../../generated/graphql';

export interface AttachmentProps {
  file: FileSnippetFragment;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
  fullWidth?: boolean;
}

const Attachment: React.FC<AttachmentProps> = ({ file, setGalleryFile, fullWidth = false }) => {
  let display: ReactNode;
  let iconDisplay: ReactNode | null = null;

  const defaultWidth = '384px';
  const defaultHeight = '216px';

  const width = fullWidth ? '100%' : defaultWidth;
  const height = fullWidth ? 'auto' : defaultHeight;
  if (file.format) {
    if (documentRegExp.test(file.format)) {
      iconDisplay = <FaRegFileAlt className="text-accent" size={25} />;
    } else if (pdfRegExp.test(file.format)) {
      iconDisplay = <FaRegFilePdf className="text-accent" size={25} />;
    } else if (sheetRegExp.test(file.format)) {
      iconDisplay = <FaRegFileExcel className="text-accent" size={25} />;
    } else if (videoRegExp.test(file.format)) {
      display = (
        <video className="my-1" style={{ width, height }} controls>
          <source src={fileApiURL + '/' + file.id} type={`video/${file.format}`}></source>
        </video>
      );
    } else if (audioRegExp.test(file.format)) {
      display = (
        <audio controls className="my-2" style={{ width }}>
          <source src={fileApiURL + '/' + file.id} type={`audio/${file.format}`} />
        </audio>
      );
    } else if (imageRegExp.test(file.format)) {
      display = (
        <div style={{ height: '230px' }}>
          <img
            src={fileApiURL + '/' + file.id}
            className="my-1 cursor-pointer"
            height={height}
            style={{ maxWidth: width, height }}
            alt={file.fileName}
            onClick={() => setGalleryFile(file)}
          />
        </div>
      );
    } else {
      iconDisplay = <FaRegFile className="text-accent" size={25} />;
    }
  } else {
    iconDisplay = <FaRegFile className="text-accent" size={25} />;
  }

  const downloadAnchor = useRef<HTMLAnchorElement | null>(null);
  if (iconDisplay) {
    display = (
      <div
        className="my-1 p-4 rounded-lg bg-dark-200 flex flex-row items-center"
        style={{ width: fullWidth ? '100%' : '13rem' }}
      >
        <div>{iconDisplay}</div>
        <div className="text-light-200 ml-1.5 truncate flex flex-col justify-center text-sm font-roboto">
          {file.fileName}
        </div>
        <div className="w-10 h-full flex flex-col justify-center items-center">
          <HiDownload
            size={20}
            className="cursor-pointer ml-2 text-light-400 hover:text-light-hover"
            title={`Download this file.(${file.size / 1000}KB) `}
            onClick={() => {
              const anchor = document.createElement('a');
              anchor.setAttribute('href', fileApiURL + '/' + file.id);
              anchor.setAttribute('download', file.fileName);
              anchor.click();
            }}
          />
          <a href={fileApiURL + '/' + file.id} ref={downloadAnchor}></a>
        </div>
      </div>
    );
  }

  return <div className="flex flex-col">{display}</div>;
};

export default Attachment;
