import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { FaHashtag } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { Modal } from 'react-tiny-modals';
import { OutgoingSocketChatMessage } from '../../..';
import ChatBottomBar from '../../../components/App/Chat/ChatBottomBar';
import ChatFeed from '../../../components/App/Chat/ChatFeed';
import ThreadListItem from '../../../components/App/Chat/ThreadListItem';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import SubmitButton from '../../../components/Buttons/SubmitButton';
import { genericErrorMessage } from '../../../constants';
import { MessageSnippetFragment, useThreadQuery, useThreadsQuery } from '../../../generated/graphql';
import { socket } from '../../../utils/createWSconnection';
import { isServer } from '../../../utils/isServer';
import { errorToast } from '../../../utils/toasts';
import withAuth from '../../../utils/withAuth';

const Chat: NextPage = () => {
  const router = useRouter();
  if (!router.query.id) {
    if (!isServer()) {
      router.replace('/app/friends/all');
    }
    return null;
  }
  const threadId = typeof router.query.id === 'object' ? router.query.id[0] : router.query.id || '';

  const { data } = useThreadQuery(
    {
      options: { threadId }
    },
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      },
      onSuccess: (d) => {
        if (d.thread.errors.length > 0) {
          console.error(d.thread.errors);
          router.replace('/app/friends/all');
        }
      }
    }
  );

  const { data: loadedThreads } = useThreadsQuery(
    {},
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      }
    }
  );

  const [modalShow, setModalShow] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<MessageSnippetFragment | null>(null);
  const [resendThreads, setResendThreads] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState<MessageSnippetFragment | null>(null);

  const handleResend = () => {
    const ws = socket.connect();
    if (resendMessage && ws) {
      resendThreads.forEach((resendThread) => {
        const payload = {
          code: 3000,
          threadId: resendThread,
          content: resendMessage.content,
          resendId: resendMessage.id
        } as OutgoingSocketChatMessage;
        socket.send(JSON.stringify(payload));
      });
      setModalShow(false);
      setResendMessage(null);
      setResendThreads([]);
    }
  };

  useEffect(() => {
    setReplyMessage(null);
  }, [threadId]);
  return (
    <>
      <Head>
        <title>Biscit | Chat - {data?.thread.data?.name} </title>
      </Head>
      <Layout>
        <ContentNav>
          <div className="flex flex-row items-center h-full select-none">
            <div className="border-r border-light-300 px-4 mr-2">
              <FaHashtag className="text-light-300 text-2xl" />
            </div>
            <div className="text-light-200 text-lg font-bold font-opensans">{data?.thread.data?.name}</div>
          </div>
        </ContentNav>

        {/* this might need to be set to position absolute */}
        <div className="w-full h-full overflow-hidden flex flex-col relative">
          <ChatFeed
            threadId={threadId}
            setResendMessage={setResendMessage}
            replyMessage={replyMessage}
            setReplyMessage={setReplyMessage}
            setModalShow={setModalShow}
          />
          <ChatBottomBar replyMessage={replyMessage} setReplyMessage={setReplyMessage} />
        </div>
      </Layout>
      <Modal isOpen={modalShow} backOpacity={0.5}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Resend message</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => {
                  setModalShow(false);
                  setResendThreads([]);
                  setResendMessage(null);
                }}
              />
            </div>
          </div>
          <div className="w-full flex-grow relative">
            <textarea
              className="text-light-200 font-opensans text-sm mb-3 bg-dark-50 outline-none p-1 w-full resize-none"
              value={resendMessage?.content}
              rows={3}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) =>
                setResendMessage({ ...resendMessage, content: e.target.value } as MessageSnippetFragment)
              }
            ></textarea>
            <p className="text-light-300 font-opensans text-md mb-3">Select all threds to send this message to.</p>
            <ul className="w-full max-h-72 overflow-auto overflow-x-hidden">
              {loadedThreads?.threads.map(({ thread }, i) => {
                return (
                  <ThreadListItem
                    thread={thread}
                    key={thread.id}
                    onChecked={(checked) => {
                      if (checked) {
                        setResendThreads([...resendThreads, thread.id]);
                        return;
                      }
                      const currentResendThreads = [...resendThreads];
                      const newResendThreads = currentResendThreads.filter((resendThread) => {
                        if (resendThread === thread.id) return false;
                        return true;
                      });
                      setResendThreads(newResendThreads);
                    }}
                  />
                );
              })}
            </ul>

            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => {
                  setModalShow(false);
                  setResendThreads([]);
                  setResendMessage(null);
                }}
              >
                Cancel
              </button>
              <SubmitButton onClick={() => handleResend()}>Send</SubmitButton>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default withAuth(Chat);
