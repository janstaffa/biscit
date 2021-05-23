import React, { ReactNode, useRef } from 'react';
import { FaRegFile, FaRegFileAlt, FaRegFileAudio, FaRegFileExcel, FaRegFilePdf, FaRegFileVideo } from 'react-icons/fa';
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
}

const Attachment: React.FC<AttachmentProps> = ({ file }) => {
  let display: ReactNode;
  let iconDisplay: ReactNode | null = null;

  if (file.format) {
    if (documentRegExp.test(file.format)) {
      iconDisplay = <FaRegFileAlt className="text-accent" size={25} />;
    } else if (pdfRegExp.test(file.format)) {
      iconDisplay = <FaRegFilePdf className="text-accent" size={25} />;
    } else if (sheetRegExp.test(file.format)) {
      iconDisplay = <FaRegFileExcel className="text-accent" size={25} />;
    } else if (videoRegExp.test(file.format)) {
      iconDisplay = <FaRegFileVideo className="text-accent" size={25} />;
    } else if (audioRegExp.test(file.format)) {
      iconDisplay = <FaRegFileAudio className="text-accent" size={25} />;
    } else if (imageRegExp.test(file.format)) {
      display = (
        <img
          src={fileApiURL + '/' + file.id}
          className="h-auto m-1"
          style={{ maxWidth: '200px', maxHeight: '500px' }}
        />
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
      <div className="w-48 my-1 p-3 rounded-lg bg-dark-200 flex flex-row items-center">
        <div>{iconDisplay}</div>
        <div className="text-light-200 ml-1.5 truncate flex flex-col justify-center text-sm font-roboto">
          {file.fileName}
        </div>
        <div className="w-10 h-full flex flex-col justify-center items-center">
          <HiDownload
            size={20}
            className="cursor-pointer ml-2 text-light-400 hover:text-light-hover"
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
