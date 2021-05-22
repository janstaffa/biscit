import React, { ReactNode } from 'react';
import { FaRegFile, FaRegFileAlt, FaRegFileAudio, FaRegFileExcel, FaRegFilePdf, FaRegFileVideo } from 'react-icons/fa';
import { attachment } from '../../..';
import { audioRegExp, documentRegExp, imageRegExp, pdfRegExp, sheetRegExp, videoRegExp } from '../../../constants';
export interface AttachmentBarProps {
  attachments: attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<attachment[]>>;
}

const AttachmentBar: React.FC<AttachmentBarProps> = ({ attachments, setAttachments }) => {
  return (
    <div className="w-full h-20 flex flex-row justify-between items-center px-10 py-1 bg-dark-200 relative">
      {attachments.map((at) => {
        let extension: string | null = null;
        if (at.name.includes('.')) {
          const dotArr = at.name.split('.');
          extension = dotArr[dotArr.length - 1];
        }
        console.log(extension);
        let display: ReactNode;
        if (!extension) {
          display = (
            <div>
              <FaRegFile />
            </div>
          );
        } else if (imageRegExp.test(extension)) {
          display = <img src={'http://localhost:9000/files/' + at.id} className="h-full" />;
        } else if (documentRegExp.test(extension)) {
          display = (
            <div>
              <FaRegFileAlt className="text-accent" size={25} />
            </div>
          );
        } else if (pdfRegExp.test(extension)) {
          display = (
            <div>
              <FaRegFilePdf className="text-accent" size={25} />
            </div>
          );
        } else if (sheetRegExp.test(extension)) {
          display = (
            <div>
              <FaRegFileExcel />
            </div>
          );
        } else if (videoRegExp.test(extension)) {
          display = (
            <div>
              <FaRegFileVideo className="text-accent" size={25} />
            </div>
          );
        } else if (audioRegExp.test(extension)) {
          display = (
            <div>
              <FaRegFileAudio className="text-accent" size={25} />
            </div>
          );
        }

        return (
          <div key={at.id} className="h-full">
            {display}
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentBar;
