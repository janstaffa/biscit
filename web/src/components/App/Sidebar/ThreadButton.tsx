import Link from 'next/link';

export interface ThreadButtonProps {
  username: string;
  time: string;
  latestMessage: string;
  undread: boolean;
  threadId: string;
  active?: boolean;
}

const ThreadButton: React.FC<ThreadButtonProps> = ({
  username,
  time,
  latestMessage,
  undread,
  threadId,
  active = false
}) => {
  console.log(latestMessage);
  return (
    <Link href={`/app/chat/${threadId}`}>
      <div className={'py-1 rounded-sm' + (active ? '  bg-dark-50' : ' hover:bg-dark-100 hover:text-light-hover')}>
        <div className="w-full h-16 flex flex-row items-center cursor-pointer py-2">
          <div className="w-16 h-full flex flex-col justify-center items-center">
            <div className="w-11 h-11 rounded-full bg-light"></div>
          </div>
          <div className="w-full flex-1 px-2">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-center">
                <div className=" text-light font-roboto">{username}</div>
                <div className=" text-light-200 text-sm font-roboto">{time}</div>
              </div>
              <div className=" w-full flex flex-row justify-between">
                <div className="text-light-300 w-48 font-roboto text-sm truncate">
                  {latestMessage ? latestMessage.slice(0, 50) : 'no messages yet'}
                </div>
                <div className="w-8 flex flex-row justify-center items-center">
                  {undread && <div className="w-4 h-4 bg-light rounded-full"></div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThreadButton;
