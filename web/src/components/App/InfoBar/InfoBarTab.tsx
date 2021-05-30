import { MdNotInterested } from 'react-icons/md';
import { FileSnippetFragment, MeQuery, ThreadMembers, ThreadQuery, ThreadsQuery } from '../../../generated/graphql';
import { formatTime } from '../../../utils/formatTime';
import Attachment from '../Chat/Attachment';
import MemberListItem from './MemberListItem';
export interface ChatInfoBarTabProps {
  tab: number;
  thread: ThreadQuery | undefined;
  setGalleryFile: React.Dispatch<React.SetStateAction<FileSnippetFragment | null>>;
  me: MeQuery;
  myThreads: ThreadsQuery | undefined;
}

const InfoBarTab: React.FC<ChatInfoBarTabProps> = ({ tab, thread, me, setGalleryFile, myThreads }) => {
  const t = thread?.thread.data;
  const media = t?.media;
  const members = t?.members;
  const admins = t?.members.filter((m) => m.isAdmin);

  switch (tab) {
    case 1:
      return (
        <div className="w-full h-full px-5 bg-dark-300 flex flex-col relative">
          {media && media.length > 0 ? (
            <>
              <div className="sticky left-0 top-0 w-full py-2 bg-dark-300 z-10 text-light-200 text-lg mb-3 font-opensans">
                Media:
              </div>
              {media.map((file) => (
                <Attachment file={file} setGalleryFile={setGalleryFile} fullWidth={true} key={file.id} />
              ))}
            </>
          ) : (
            <div className="text-light-300 flex flex-col items-center pt-10">
              <MdNotInterested size={40} />
              <span className="mt-1">no media sent</span>
            </div>
          )}
        </div>
      );
    case 2:
      return (
        <div className="w-full h-full px-5 bg-dark-300 flex flex-col relative">
          {members && members.length > 0 && (
            <>
              <div className="sticky left-0 top-0 w-full py-2 bg-dark-300 z-10 text-light-200 text-lg mb-3 font-opensans">
                Members:
              </div>
              {members.map((member) => (
                <MemberListItem
                  member={member as ThreadMembers}
                  me={me}
                  myThreads={myThreads}
                  thread={thread}
                  key={member.id}
                />
              ))}
            </>
          )}
        </div>
      );
    case 3:
      return (
        <div className="w-full h-full px-5 bg-dark-300 flex flex-col relative">
          <div className="sticky left-0 top-0 w-full py-2 bg-dark-300 z-10 text-light-200 text-lg mb-3 font-opensans">
            Info:
          </div>
          <div className="w-full">
            <ul className="text-light-300 list-none">
              {t?.createdAt && (
                <li>
                  created: <span className="font-bold">{formatTime(t.createdAt, { fullDate: true })}</span>
                </li>
              )}
              {t?.creator && (
                <li>
                  creator: <span className="font-bold">{t.creator.username}</span>
                </li>
              )}
              <hr className="bg-dark-50 h-px border-none my-2" />
              {!t?.isDm && (
                <>
                  <li>
                    members: <span className="font-bold">{t?.members.length}</span>
                  </li>
                  <li>
                    admins: <span className="font-bold">{admins?.length}</span>
                  </li>
                  <hr className="bg-dark-50 h-px border-none my-2" />
                </>
              )}
              <li>
                last activity: <span className="font-bold">{formatTime(t?.lastActivity, { fullDate: true })}</span>
              </li>
              <hr className="bg-dark-50 h-px border-none my-2" />
              <li>
                sent attachments: <span className="font-bold">{t?.media?.length}</span>
              </li>
              <li>
                sent messages: <span className="font-bold">{t?.messagesCount}</span>
              </li>
            </ul>
          </div>
        </div>
      );
    default:
      return <div></div>;
  }
};

export default InfoBarTab;
