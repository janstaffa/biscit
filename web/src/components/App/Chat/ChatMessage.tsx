import { MessageSnippetFragment } from '../../../generated/graphql';
import { formatTime } from '../../../utils/formatTime';

export interface ChatMessageProps {
  message: MessageSnippetFragment;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className="w-full h-auto my-2.5 flex flex-row">
      <div className="h-16 w-16 flex flex-col justify-center items-center">
        <div className="w-12 h-12 bg-white rounded-full"></div>
      </div>
      <div className="flex-1 flex flex-col px-2 py-1">
        <div className="flex flex-row">
          <div className="text-light font-roboto text-base">{message.user.username}</div>
          <div className="text-light-300 font-roboto text-sm flex flex-col justify-center ml-2">
            {formatTime(message.createdAt)}
          </div>
        </div>
        <div className="text-light-200 font-roboto text-md">{message.content}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
