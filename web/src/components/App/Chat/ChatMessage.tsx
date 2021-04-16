export interface ChatMessageProps {
  sender: string;
  time: string;
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, time, content }) => {
  return (
    <div className="w-full h-auto my-1 flex flex-row">
      <div className="h-16 w-16 flex flex-col justify-center items-center">
        <div className="w-12 h-12 bg-white rounded-full"></div>
      </div>
      <div className="flex-1 flex flex-col px-2 py-1">
        <div className="flex flex-row">
          <div className="text-light font-roboto text-base">{sender}</div>
          <div className="text-light-300 font-roboto text-sm flex flex-col justify-center ml-2">
            {time}
          </div>
        </div>
        <div className="text-light-200 font-roboto text-md">{content}</div>
      </div>
    </div>
  );
};

export default ChatMessage;
