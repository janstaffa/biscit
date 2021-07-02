// export interface VideoChatProps {}
import React, { useContext, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { Popup } from 'react-tiny-modals';
import { ThreadSnippetFragment } from '../../../generated/graphql';
import { RTCcontext } from '../../../utils/RTCProvider';
import Video from './Video';

type VideoChatProps = {
  callId: string;
  thread: ThreadSnippetFragment;
};

const defaultVolume = 100;

const VideoChat: React.FC<VideoChatProps> = ({ callId, thread }) => {
  const rtcContext = useContext(RTCcontext);

  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [volume, setVolume] = useState<number>(defaultVolume);
  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;

  if (!rtcContext) return null;
  return (
    <div
      className="w-full bg-dark-300 absolute top-0 left-0 border-b-2 border-dark-50 pt-12"
      style={{ height: '550px' }}
    >
      <div className="w-full h-full flex flex-col">
        <div
          className="w-full flex-grow flex flex-row flex-wrap justify-center overflow-auto"
          ref={videoContainer}
          style={{ padding: videoContainerPadding + 'px' }}
        >
          {rtcContext.callDetails?.streams.map((stream) => {
            return (
              <Video
                isMe={stream.isMe}
                stream={stream.stream}
                peerId={stream.peerId}
                camera={stream.camera}
                mic={stream.mic}
                screenShare={stream.screenShare}
                userId={stream.userId}
                volume={rtcContext.options.volume}
                isDeafened={rtcContext.options.isDeafened}
                thread={thread}
                key={stream.peerId}
              />
            );
          })}
        </div>
        <div
          className="w-full h-20 bg-dark-200 flex flex-row justify-center items-center relative"
          style={{ minHeight: '80px' }}
        >
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (rtcContext.options.camera ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title={rtcContext.options.camera ? 'Turn off your camera' : 'Turn on your camera'}
            onClick={() =>
              rtcContext.handleStreamChange(
                rtcContext.options.mic,
                !rtcContext.options.camera,
                rtcContext.options.screenShare
              )
            }
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (rtcContext.options.mic ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title={rtcContext.options.mic ? 'Mute your microphone' : 'Unmute your microphone'}
            onClick={() =>
              rtcContext.handleStreamChange(
                !rtcContext.options.mic,
                rtcContext.options.camera,
                rtcContext.options.screenShare
              )
            }
          >
            <AiOutlineAudioMuted size={20} />
          </button>
          <button
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex flex-col justify-center items-center mx-2"
            title="Leave call"
            onClick={() => {
              rtcContext.leaveCall();
            }}
          >
            <HiPhoneMissedCall size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (rtcContext.options.isDeafened
                ? ' text-black bg-red-500 border-none'
                : ' text-light-300 hover:bg-light-400')
            }
            title="Volume off"
            onClick={() => rtcContext.handleDeafen(!rtcContext.options.isDeafened)}
          >
            <VscMute size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (rtcContext.options.screenShare
                ? ' text-black bg-red-500 border-none'
                : ' text-light-300 hover:bg-light-400')
            }
            title={rtcContext.options.screenShare ? 'Cancel screen sharing' : 'Share your screen'}
            onClick={() => rtcContext.handleScreenShare()}
          >
            <MdScreenShare size={20} />
          </button>

          <div className="absolute right-0">
            <Popup
              position={['top', 'left', 'bottom', 'right']}
              closeOnClickOutside={true}
              outerPadding={5}
              align={'end'}
              content={() => (
                <div className="w-64 h-64 bg-dark-100 rounded-md p-1 flex flex-row flex-wrap">
                  <div className="w-full">
                    <ul>
                      <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-row items-center">
                        Call options
                      </li>
                      <hr className="bg-dark-50 h-px border-none mt-1" />
                      <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-col justify-center">
                        <span className="mb-1">Choose input microphone</span>
                        <select
                          className="w-full outline-none font-opensans text-left p-1 bg-dark-300 border-none hover:bg-dark-200 text-light"
                          onChange={(e) => {
                            rtcContext.handleDeviceSwitch(e.target.value);
                          }}
                        >
                          {rtcContext.devices.map((device) => {
                            if (device.kind !== 'audioinput') return null;
                            const isSelected = device.deviceId === rtcContext.options.audioDevice?.deviceId;
                            return (
                              <option value={device.deviceId} selected={isSelected} key={device.deviceId}>
                                {device.label}
                              </option>
                            );
                          })}
                        </select>
                      </li>
                      <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-col justify-center">
                        <span className="mb-1">Choose input camera</span>
                        <select
                          className="w-full outline-none font-opensans text-left p-1 bg-dark-300 border-none hover:bg-dark-200 text-light"
                          onChange={(e) => {
                            rtcContext.handleDeviceSwitch(e.target.value);
                          }}
                        >
                          {rtcContext.devices.map((device) => {
                            if (device.kind !== 'videoinput') return null;
                            const isSelected = device.deviceId === rtcContext.options.videoDevice?.deviceId;
                            return (
                              <option value={device.deviceId} selected={isSelected} key={device.deviceId}>
                                {device.label}
                              </option>
                            );
                          })}
                        </select>
                      </li>
                      <hr className="bg-dark-50 h-px border-none" />
                      <li className="text-light-300 text-sm font-opensans text-left px-2 py-1 flex flex-col justify-center">
                        <span className="mb-1">Master volume {volume}%</span>
                        <input
                          type="range"
                          name=""
                          id=""
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value))}
                          onMouseUp={() => rtcContext.changeVolume(volume)}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              innerStyle={{ position: 'absolute' }}
            >
              {({ show, setShow }) => (
                <div className=" w-20 h-full flex flex-col justify-center items-center">
                  <HiDotsVertical
                    className="text-light-300 text-2xl hover:text-light-200 cursor-pointer"
                    title="Settings"
                    onClick={() => setShow(!show)}
                  />
                </div>
              )}
            </Popup>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
