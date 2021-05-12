import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { FaHashtag } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { InfiniteData, useInfiniteQuery } from 'react-query';
import { ClipLoader } from 'react-spinners';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {
  IncomingDeleteMessage,
  IncomingSocketChatMessage,
  IncomingUpdateMessage,
  OutgoingSocketChatMessage
} from '../../..';
import ChatBottomBar from '../../../components/App/Chat/ChatBottomBar';
import ChatMessage from '../../../components/App/Chat/ChatMessage';
import ThreadListItem from '../../../components/App/Chat/ThreadListItem';
import ContentNav from '../../../components/App/ContentNav';
import Layout from '../../../components/App/Layout';
import SubmitButton from '../../../components/Buttons/SubmitButton';
import Modal from '../../../components/modals/Modal';
import { genericErrorMessage } from '../../../constants';
import {
  Message,
  MessageSnippetFragment,
  ThreadMessagesDocument,
  ThreadMessagesQuery,
  ThreadMessagesResponse,
  useMeQuery,
  useThreadQuery,
  useThreadsQuery
} from '../../../generated/graphql';
import { graphqlClient } from '../../../utils/createGQLClient';
import { queryClient } from '../../../utils/createQueryClient';
import { socket } from '../../../utils/createWSconnection';
import { datesAreSameDay } from '../../../utils/datesAreSameDay';
import { isServer } from '../../../utils/isServer';
import { errorToast } from '../../../utils/toasts';
import withAuth from '../../../utils/withAuth';

const messagesLimit = 30;
const Chat: NextPage = () => {
  const router = useRouter();
  if (!router.query.id) {
    if (!isServer()) {
      router.replace('/app/friends/all');
    }
    return null;
  }
  const threadId = typeof router.query.id === 'object' ? router.query.id[0] : router.query.id || '';

  const { data: meData } = useMeQuery();
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

  const incomingThreadMessagesRef = useRef<InfiniteData<ThreadMessagesQuery> | undefined>();
  const {
    data: incomingThreadMessages,
    refetch: refetchThreadMessages,
    status,
    fetchNextPage
  } = useInfiniteQuery<ThreadMessagesQuery>(
    `ThreadMessages-${threadId}`,
    ({ pageParam = null }) => {
      const vars = {
        options: {
          threadId,
          cursor: pageParam,
          limit: messagesLimit
        }
      };
      return graphqlClient.request(ThreadMessagesDocument, vars);
    },
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      },
      // getNextPageParam: (lastPage, pages) => {
      //   if (lastPage?.messages?.data) {
      //     console.log(lastPage, pages);
      //     return lastPage.messages.data[0].createdAt;
      //   }
      //   return null;
      // },
      enabled: false
    }
  );
  incomingThreadMessagesRef.current = incomingThreadMessages;
  const { data: loadedThreads } = useThreadsQuery(
    {},
    {
      onError: (err) => {
        console.error(err);
        errorToast(genericErrorMessage);
      }
    }
  );

  useEffect(() => {
    console.log('STATUS', status);
  }, [status]);
  const [messages, setMessages] = useState<MessageSnippetFragment[]>([]);
  const messagesRef = useRef<MessageSnippetFragment[]>([]);
  messagesRef.current = messages;

  const [moreMessages, setMoreMessages] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  const [modalShow, setModalShow] = useState<boolean>(false);
  const scroll = (px = 0) => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (!feed) return;

    feed.scrollTop = px === 0 ? feed.scrollHeight : px;
  };

  const joinRoom = (ws: ReconnectingWebSocket) => {
    console.log('JOIN ROOK');
    const payload = {
      code: 3002,
      threadId
    };
    ws.send(JSON.stringify(payload));
  };

  useEffect(() => {
    const ws = socket.connect();
    if (isServer() || !ws) return;

    setMessages([]);
    messagesRef.current = [];
    setMoreMessages(false);
    setIsLoadingMessages(false);

    if (!queryClient.getQueryData(`ThreadMessages-${threadId}`)) {
      fetchNextPage({ pageParam: null });
    }

    const handleMessage = (e) => {
      const { data: m } = e;
      const incoming = JSON.parse(m);
      if (incoming.code === 3000) {
        const { message, threadId: incomingThreadId } = incoming as IncomingSocketChatMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        currentMessages.push(message as MessageSnippetFragment);

        const pages: InfiniteData<ThreadMessagesQuery> | undefined = queryClient.getQueryData(
          `ThreadMessages-${threadId}`
        );
        if (pages?.pages) {
          pages.pages[0].messages.data?.push(message);
          queryClient.setQueryData(`ThreadMessages-${threadId}`, pages);
        }
        setMessages(currentMessages);
        scroll(0);
      } else if (incoming.code === 3007) {
        const { messageId, threadId: incomingThreadId } = incoming as IncomingDeleteMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        const thisMessage = currentMessages.find((message) => {
          if (message.id === messageId) return true;
          return false;
        });

        if (thisMessage && currentMessages.includes(thisMessage)) {
          currentMessages.splice(currentMessages.indexOf(thisMessage), 1);
          setMessages(currentMessages);
        }
      } else if (incoming.code === 3008) {
        const { messageId, threadId: incomingThreadId, newContent } = incoming as IncomingUpdateMessage;
        if (incomingThreadId !== threadId) return;

        const currentMessages = [...messagesRef.current];
        const thisMessage = currentMessages.find((message) => {
          if (message.id === messageId) return true;
          return false;
        });

        if (thisMessage && currentMessages.includes(thisMessage)) {
          const idx = currentMessages.indexOf(thisMessage);
          currentMessages.splice(idx, 1, {
            ...thisMessage,
            content: newContent,
            edited: true,
            updatedAt: new Date().toISOString()
          });

          setMessages(currentMessages);
        }
      }
    };
    const handleOpen = () => {
      joinRoom(ws);
    };
    try {
      scroll(0);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('open', handleOpen);
      if (ws.readyState === ws.OPEN) {
        handleOpen();
      }
    } catch (err) {
      console.error(err);
    }
    return () => {
      console.log(queryClient.getQueryCache());
      ws.removeEventListener('message', handleMessage);
      ws.removeEventListener('open', handleOpen);
    };
  }, [threadId]);

  const [resendMessage, setResendMessage] = useState<MessageSnippetFragment | null>(null);
  const [resendThreads, setResendThreads] = useState<string[]>([]);
  const handleResendCall = (message: MessageSnippetFragment) => {
    setModalShow(true);
    setResendMessage(message);
  };
  const handleResend = () => {
    const ws = socket.connect();
    resendThreads.forEach((resendThread) => {
      const payload = {
        code: 3000,
        threadId: resendThread,
        content: resendMessage?.content,
        resended: true
      } as OutgoingSocketChatMessage;
      ws?.send(JSON.stringify(payload));
    });
    setModalShow(false);
  };

  useEffect(() => {
    return function cleanup() {
      setMoreMessages(false);
      setIsLoadingMessages(false);
      setMessages([]);
      messagesRef.current = [];
    };
  }, []);
  useEffect(() => {
    console.log('INCOMING: ', incomingThreadMessages, queryClient.getQueryState(`ThreadMessages-${threadId}`));
    setIsLoadingMessages(true);
    if (!incomingThreadMessages?.pages) return;
    // const reverseThreadMessages = incomingThreadMessages.pages.reverse();
    if (messagesRef.current.length === 0) {
      console.log('SETTING');
      const { data: incomingMessages, hasMore, errors } = incomingThreadMessages.pages[0]
        .messages as ThreadMessagesResponse;

      if (incomingMessages) {
        setMessages(incomingMessages);
        setMoreMessages(hasMore);
        setIsLoadingMessages(false);
      }
      return;
    }
    incomingThreadMessages.pages.forEach((page) => {
      console.log('CURRENT PAGE:', page, incomingThreadMessages);
      if (page.messages) {
        const { data: incomingMessages, hasMore, errors } = page.messages as ThreadMessagesResponse;

        if (errors.length > 0) {
          errors.forEach((err) => {
            if (err.details?.message) {
              errorToast(err.details.message);
            }
          });
          return;
        }
        if (incomingMessages) {
          const tempMessages = messagesRef.current.filter((message) => {
            if (incomingMessages.indexOf(message as Message) === -1) return true;
            return false;
          });
          const newMessages = [...incomingMessages, ...tempMessages];
          const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
          const feedMessages = feed.querySelectorAll('.message');
          const lastMessageEl = feedMessages[0];

          if (newMessages.length > messagesLimit && lastMessageEl && !(incomingMessages.length > messagesLimit)) {
            lastMessageEl.scrollIntoView();
          }

          setMessages(newMessages);

          if (incomingMessages.length > messagesLimit) {
            scroll(0);
          }

          setMoreMessages(hasMore);
          setIsLoadingMessages(false);
        }
      }
    });
  }, [incomingThreadMessages]);

  useEffect(() => {
    const firstPageMessages = incomingThreadMessages?.pages[0].messages.data;
    if (
      messages.length <= messagesLimit ||
      (messages.length < messagesLimit && firstPageMessages && firstPageMessages?.length > messagesLimit)
    ) {
      scroll(0);
    }
  }, [messages]);

  useEffect(() => {
    const feed = document.querySelector('#chat-feed')! as HTMLDivElement;
    if (moreMessages) {
      feed.onscroll = () => {
        if (feed.scrollTop === 0) {
          const cursor = messagesRef.current[0].createdAt;
          if (incomingThreadMessagesRef.current?.pageParams.find((p) => p === cursor)) {
            incomingThreadMessagesRef.current.pages.splice(
              incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
              1
            );
            incomingThreadMessagesRef.current.pageParams.splice(
              incomingThreadMessagesRef.current.pageParams.indexOf(cursor),
              1
            );
            const newData = {
              pages: incomingThreadMessagesRef.current.pages,
              pageParams: incomingThreadMessagesRef.current.pageParams
            };
            queryClient.setQueryData(`ThreadMessages-${threadId}`, newData);
          }
          fetchNextPage({ pageParam: cursor });
        }
      };
      return () => {
        feed.onscroll = null;
      };
    }
  }, [moreMessages]);

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
        <div className="w-full h-full overflow-hidden relative flex flex-col">
          <div className="flex-grow px-3 py-1 mt-12 overflow-y-scroll" id="chat-feed">
            {isLoadingMessages && (
              <div className="w-full h-10 text-center text-light-300 text-lg font-roboto">
                <ClipLoader color="#e09f3e" size={30} />{' '}
              </div>
            )}
            {messages?.map((message, i) => {
              const { id: messageId } = message;
              const date = new Date(parseInt(message.createdAt));
              const now = new Date();

              if (datesAreSameDay(date, now)) {
                const prevMessage = messages[i - 1];
                if (prevMessage) {
                  const prevDate = new Date(parseInt(prevMessage.createdAt));

                  if (!datesAreSameDay(prevDate, now)) {
                    return (
                      <div key={messageId}>
                        <div className="text-center my-4">
                          <hr className="bg-dark-50 h-px border-none" />
                          <div
                            className="text-light-300 font-roboto bg-dark w-20 text-md leading-none mx-auto bg-dark-100"
                            style={{ marginTop: '-10px' }}
                          >
                            today
                          </div>
                        </div>
                        <ChatMessage
                          message={message}
                          myId={meData?.me?.id}
                          resendCall={() => handleResendCall(message)}
                        />
                      </div>
                    );
                  }
                }
              }
              return (
                <ChatMessage
                  message={message}
                  myId={meData?.me?.id}
                  key={messageId}
                  resendCall={() => handleResendCall(message)}
                />
              );
            })}
          </div>
          <ChatBottomBar />
        </div>
      </Layout>
      <Modal active={modalShow}>
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
      </Modal>
    </>
  );
};

export default withAuth(Chat);
