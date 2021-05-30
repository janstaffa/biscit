import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { FaHashtag, FaVideo } from 'react-icons/fa';
import { HiDotsVertical } from 'react-icons/hi';
import { IoMdCall, IoMdClose } from 'react-icons/io';
import { Modal } from 'react-tiny-modals';
import { OutgoingSocketChatMessage } from '../../..';
import ChatBottomBar from '../../../components/App/Chat/ChatBottomBar';
import ChatFeed from '../../../components/App/Chat/ChatFeed';
import ChatInfoBar from '../../../components/App/Chat/ChatInfoBar';
import ImageGallery from '../../../components/App/Chat/ImageGallery';
import ThreadListItem from '../../../components/App/Chat/ThreadListItem';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import SubmitButton from '../../../components/Buttons/SubmitButton';
import { genericErrorMessage } from '../../../constants';
import {
  FileSnippetFragment,
  MessageSnippetFragment,
  useThreadQuery,
  useThreadsQuery
} from '../../../generated/graphql';
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

  const [resendModalShow, setResendModalShow] = useState<boolean>(false);
  const [editModalShow, setEditModalShow] = useState<boolean>(false);
  const [editThreadName, setEditThreadName] = useState<string>(data?.thread.data?.name || '');

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
      setResendModalShow(false);
      setResendMessage(null);
      setResendThreads([]);
    }
  };

  useEffect(() => {
    setReplyMessage(null);
  }, [threadId]);

  const [galleryFile, setGalleryFile] = useState<FileSnippetFragment | null>(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (galleryFile) {
          setGalleryFile(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryFile]);

  const [showChatInfo, setShowChatInfo] = useState<boolean>(false);
  return (
    <>
      <Head>
        <title>Biscit | Chat - {data?.thread.data?.name} </title>
      </Head>
      <Layout>
        <ContentNav>
          <div className="flex flex-row justify-between h-full select-none">
            <div className="flex flex-row items-center">
              <div className="border-r border-light-300 px-4 mr-2">
                <FaHashtag className="text-light-300 text-2xl" />
              </div>
              <div className="text-light-200 text-lg font-bold font-opensans">{data?.thread.data?.name}</div>
            </div>
            <div className="flex flex-row items-center justify-center mr-2">
              <FaVideo
                size={24}
                className="text-light-300 hover:text-light-hover cursor-pointer mx-2"
                title="Video call"
              />
              <IoMdCall size={24} className="text-light-300 hover:text-light-hover cursor-pointer mx-2" title="Call" />
              <HiDotsVertical
                size={26}
                className="text-light-200 hover:text-light-hover cursor-pointer mx-1"
                title="Open info tab"
                onClick={() => setShowChatInfo(!showChatInfo)}
              />
            </div>
          </div>
        </ContentNav>

        <div className="w-full h-full overflow-hidden flex flex-col relative">
          <div className="flex flex-row flex-grow overflow-y-auto overflow-x-hidden relative">
            <ChatFeed
              threadId={threadId}
              setResendMessage={setResendMessage}
              replyMessage={replyMessage}
              setReplyMessage={setReplyMessage}
              setModalShow={setResendModalShow}
              setGalleryFile={setGalleryFile}
            />
            <ChatInfoBar
              show={showChatInfo}
              thread={data}
              setGalleryFile={setGalleryFile}
              setEditModalShow={setEditModalShow}
              editModalShow={editModalShow}
            />
          </div>
          <ChatBottomBar replyMessage={replyMessage} setReplyMessage={setReplyMessage} />
        </div>
      </Layout>
      {galleryFile && <ImageGallery file={galleryFile} setGalleryFile={setGalleryFile} />}
      <Modal isOpen={resendModalShow} backOpacity={0.5}>
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Resend message</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => {
                  setResendModalShow(false);
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
            <p className="text-light-300 font-opensans text-md mb-3">Select all threads to send this message to.</p>
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
                  setResendModalShow(false);
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
      <Modal
        isOpen={editModalShow}
        zIndex={100}
        backOpacity={0.5}
        onOpen={() => setEditThreadName(data?.thread.data?.name || '')}
      >
        <div className="bg-dark-200 p-5 rounded-xl w-96">
          <div className="w-full h-10 flex flex-row justify-between">
            <div className="text-light-300 text-lg font-roboto">Edit thread</div>
            <div>
              <IoMdClose
                className="text-2xl text-light-300 hover:text-light cursor-pointer"
                onClick={() => setEditModalShow(false)}
              />
            </div>
          </div>
          <div className="w-full flex-grow">
            <div className="w-full h-auto flex flex-col justify-center items-center mb-3">
              <div className="w-28 h-28 bg-white rounded-full"></div>
            </div>
            <p className="text-light-300 font-opensans text-md mb-1">Thread name</p>
            <input
              type="text"
              className="w-full h-9 rounded-md bg-dark-100 focus:bg-dark-50 outline-none px-3 text-light-200"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={100}
              value={editThreadName}
              onChange={(e) => setEditThreadName(e.target.value)}
            />
            <p className="text-light-300 mt-1 text-sm">max 100 characters</p>
            <div className="w-full flex flex-row justify-end mt-6">
              <button
                className="px-6 py-1.5 bg-transparent text-light-200 hover:text-light-300  rounded-md font-bold mt-2"
                onClick={() => setEditModalShow(false)}
              >
                Cancel
              </button>
              <SubmitButton onClick={async () => {}}>Save</SubmitButton>
            </div>
          </div>
        </div>{' '}
      </Modal>
    </>
  );
};

export default withAuth(Chat);
