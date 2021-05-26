import { FileSnippetFragment, ThreadQuery } from '../../../generated/graphql';
import { formatTime } from '../../../utils/formatTime';
import Attachment from './Attachment';

export interface ChatInfoBarProps {
  show: boolean;
  thread: ThreadQuery | undefined;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
}

const ChatInfoBar: React.FC<ChatInfoBarProps> = ({ show, thread, setGalleryFile }) => {
  const media = thread?.thread.data?.media;

  return (
    <div
      className="bg-dark-200 mt-12 border-l-2 border-dark-50 absolute right-0 overflow-x-hidden"
      style={{
        width: '350px',
        height: 'calc(100% - 3rem)',
        transition: 'margin 0.3s ease',
        marginRight: show ? '0' : '-350px'
      }}
    >
      <div className="w-full h-56 flex flex-col items-center p-5 border-b-2 border-dark-50">
        <div className="w-28 h-28 bg-white rounded-full mb-3"></div>
        <h3 className="text-xl text-light-200 text-center font-opensans">{thread?.thread.data?.name}</h3>
        <p className="text-md text-light-300 text-center font-opensans">
          {thread?.thread.data?.isDm ? 'friends since ' : 'created '}:
          {thread?.thread.data?.createdAt ? formatTime(thread?.thread.data?.createdAt) : 'unknown'}
        </p>
      </div>
      {media && media.length > 0 && (
        <div className="w-full max-h-96 h-auto overflow-y-auto px-5 bg-dark-300 flex flex-col relative">
          <div className="sticky left-0 top-0 w-full py-2 bg-dark-300 z-10 text-light-200 text-lg mb-3 font-opensans">
            Media:
          </div>
          {media.map((file) => (
            <Attachment file={file} setGalleryFile={setGalleryFile} fullWidth={true} key={file.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInfoBar;
