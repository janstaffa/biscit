import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import { FaRegSmile } from 'react-icons/fa';
import { ImAttachment } from 'react-icons/im';
import ChatLayout from '../../../components/App/Chat/ChatLayout';
import ChatMessage from '../../../components/App/Chat/ChatMessage';

const Chat = () => {
  const router = useRouter();
  return (
    <>
      <Head>
        <title>Biscit | Chat </title>
      </Head>
      <ChatLayout>
        <div className="flex-grow px-3 py-1 mt-12">
          <ChatMessage
            sender="janstaffa"
            time="10:25"
            content="Nulla veniam ut dolore fugiat voluptate ut adipisicing dolor eu veniam voluptate deserunt fugiat. Enim anim in est Lorem ad dolore ad ea enim ut mollit sint in. Qui ipsum laboris laborum dolor."
          />
        </div>
        <div className="w-full h-24 bg-dark-300 px-8 flex flex-col justify-center">
          <div className="flex flex-row">
            <div className="w-14 bg-dark-100 flex flex-col justify-center items-center border-r border-dark-50 rounded-l-xl">
              <ImAttachment className="text-2xl text-light-300" />
            </div>
            <div className="flex-grow justify-center">
              <input
                className="w-full h-12 bg-dark-100 outline-none text-light-200 px-4 text-base font-roboto flex resize-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="press 'enter' to send the message"
              />
            </div>
            <div className="w-20 bg-dark-100 rounded-r-xl flex flex-row justify-center items-center ">
              <FaRegSmile className="text-2xl text-light-300" />
            </div>
          </div>
          <div className="w-full h-5 text-light-300 text-md mt-1 ml-1 font-roboto">
            janstaffa is typing...
          </div>
        </div>
      </ChatLayout>
    </>
  );
};

export default Chat;
