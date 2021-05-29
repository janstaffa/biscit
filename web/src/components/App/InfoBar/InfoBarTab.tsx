import { FileSnippetFragment, MeQuery, ThreadMembers, ThreadQuery, ThreadsQuery } from '../../../generated/graphql';
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
  const media = thread?.thread.data?.media;
  const members = thread?.thread.data?.members;

  switch (tab) {
    case 1:
      return (
        <div>
          {media && media.length > 0 && (
            <div className="w-full h-full px-5 bg-dark-300 flex flex-col relative">
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
    case 2:
      return (
        <div>
          {members && members.length > 0 && (
            <div className="w-full h-full px-5 bg-dark-300 flex flex-col relative">
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
            </div>
          )}
        </div>
      );
    case 3:
      return <div>info tab</div>;
    default:
      return <div></div>;
  }
};

export default InfoBarTab;
