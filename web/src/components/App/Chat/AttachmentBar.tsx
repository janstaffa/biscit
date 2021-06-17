import React, { ReactNode } from 'react';
import { FaRegFile, FaRegFileAlt, FaRegFileAudio, FaRegFileExcel, FaRegFilePdf, FaRegFileVideo } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { attachment } from '../../..';
import { audioRegExp, documentRegExp, imageRegExp, pdfRegExp, sheetRegExp, videoRegExp } from '../../../constants';
import { useDeleteFileMutation } from '../../../generated/graphql';
export interface AttachmentBarProps {
  attachments: attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<attachment[]>>;
}

const AttachmentBar: React.FC<AttachmentBarProps> = ({ attachments, setAttachments }) => {
  const { mutate: deleteFile } = useDeleteFileMutation();
  return (
    <div className="w-full px-3 bg-dark-200 overflow-y-auto" style={{ minHeight: '80px' }}>
      <div className="w-full flex flex-row justify-start items-center flex-wrap py-1.5">
        {attachments.map((at) => {
          let extension: string | null = null;
          if (at.name.includes('.')) {
            const dotArr = at.name.split('.');
            extension = dotArr[dotArr.length - 1];
          }
          let display: ReactNode;
          if (extension) {
            if (imageRegExp.test(extension)) {
              display = <img src={'http://localhost:9000/files/' + at.id} className="h-auto w-14" />;
            } else if (documentRegExp.test(extension)) {
              display = <FaRegFileAlt className="text-accent" size={25} />;
            } else if (pdfRegExp.test(extension)) {
              display = <FaRegFilePdf className="text-accent" size={25} />;
            } else if (sheetRegExp.test(extension)) {
              display = <FaRegFileExcel className="text-accent" size={25} />;
            } else if (videoRegExp.test(extension)) {
              display = <FaRegFileVideo className="text-accent" size={25} />;
            } else if (audioRegExp.test(extension)) {
              display = <FaRegFileAudio className="text-accent" size={25} />;
            } else {
              display = <FaRegFile className="text-accent" size={25} />;
            }
          }
          return (
            <div
              key={at.id}
              className="w-auto h-14 m-1.5 rounded-xl inline-flex  flex-row justify-center items-center bg-dark-100 relative"
              style={{ minWidth: '56px' }}
              title={at.name}
            >
              <div className="absolute" style={{ top: '-5px', right: '-5px' }}>
                <IoMdCloseCircle
                  className="text-light-200 cursor-pointer hover:text-light-hover"
                  size={20}
                  title={'Remove attachment.'}
                  onClick={() => {
                    const idx = attachments.indexOf(at);
                    const newAttachments = [...attachments];
                    newAttachments.splice(idx, 1);
                    setAttachments(newAttachments);
                    deleteFile({ options: { fileId: at.id } });
                  }}
                />
              </div>
              <div
                className="h-full w-auto truncate flex flex-col justify-center items-start text-light-300 px-3 font-opensans"
                style={{ maxWidth: '130px' }}
              >
                {at.name}
              </div>
              <div className="h-14 w-14 flex flex-col justify-center items-center overflow-hidden rounded-r-xl">
                {display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttachmentBar;
