// export interface VideoChatProps {}
import React, { useEffect, useRef, useState } from 'react';
import { AiOutlineAudioMuted } from 'react-icons/ai';
import { BiVideoOff } from 'react-icons/bi';
import { HiDotsVertical, HiPhoneMissedCall } from 'react-icons/hi';
import { MdScreenShare } from 'react-icons/md';
import { VscMute } from 'react-icons/vsc';
import { Popup } from 'react-tiny-modals';
import { useLeaveCallMutation, useMeQuery } from '../../../generated/graphql';
import {
  IncomingJoinCallMessage,
  IncomingPeerChangeMessage,
  OutgoingJoinCallMessage,
  OutgoingPeerChangeMessage
} from '../../../types';
import { RTCconnection } from '../../../utils/createRTCconnection';
import { socket } from '../../../utils/createWSconnection';
import { errorToast } from '../../../utils/toasts';
import Video from './Video';

interface VideoType {
  peerId: string;
  username?: string;
  stream: MediaStream;
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isMe: boolean;
  volume: number;
}

type VideoChatProps = {
  callId: string;
  setIsInCall: React.Dispatch<React.SetStateAction<boolean>>;
};

interface VideoChatOptions {
  mic: boolean;
  camera: boolean;
  screenShare: boolean;
  isDeafened: boolean;
  volume: number;
  videoDevice: MediaDeviceInfo | undefined;
  audioDevice: MediaDeviceInfo | undefined;
}
const defaultVolume = 100;

const VideoChat: React.FC<VideoChatProps> = ({ callId, setIsInCall }) => {
  const videoContainer = useRef<HTMLDivElement | null>(null);
  const videoContainerPadding = 20;
  const [videos, setVideos] = useState<VideoType[]>([]);
  const videosRef = useRef<VideoType[]>([]);
  videosRef.current = videos;
  const { mutate: leaveCall } = useLeaveCallMutation();

  const { data: meData } = useMeQuery();

  const [options, setOptions] = useState<VideoChatOptions>({
    mic: true,
    camera: true,
    screenShare: false,
    isDeafened: false,
    volume: defaultVolume,
    videoDevice: undefined,
    audioDevice: undefined
  });
  const optionsRef = useRef<VideoChatOptions>(options);
  optionsRef.current = options;
  const rtcRef = useRef<RTCconnection>();

  const [volume, setVolume] = useState<number>(defaultVolume);
  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const createVideo = (
    peerId: string,
    stream: MediaStream,
    camera: boolean,
    mic: boolean,
    screenShare: boolean,
    isMe: boolean,
    username?: string
  ) => {
    const prevVideos = [...videosRef.current];
    const alreadyExists = videosRef.current.find((video) => video.peerId === peerId);
    if (alreadyExists) {
      prevVideos.splice(prevVideos.indexOf(alreadyExists), 1);
    }
    const newVideo: VideoType = {
      peerId,
      stream,
      camera,
      screenShare,
      mic,
      username,
      isMe,
      volume
    };

    setVideos([...prevVideos, newVideo]);
  };
  const removeVideo = (peerId: string) => {
    const newVideos = [...videosRef.current];
    const thisVideo = newVideos.find((video) => video.peerId === peerId);
    if (!thisVideo) return;
    newVideos.splice(newVideos.indexOf(thisVideo), 1);
    setVideos(newVideos);
  };

  const handleStreamChange = (audio: boolean, video: boolean, screenShare?: boolean) => {
    const realScreenShare = screenShare && !optionsRef.current.screenShare;

    const { mic, screenShare: optionsScreenShare, audioDevice, videoDevice } = optionsRef.current;
    if (audio === mic && optionsScreenShare) return;

    console.log(audio, video, screenShare);
    rtcRef.current
      ?.changeStream(audio, video, audioDevice?.deviceId, videoDevice?.deviceId, screenShare)
      ?.then((newStream) => {
        if (!rtcRef.current) return;

        setOptions({ ...optionsRef.current, mic: audio, camera: video });

        const oldVideos = [...videosRef.current];
        const myVideo = oldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);

        if (myVideo) {
          const updatedVideo = {
            ...myVideo,
            mic: audio,
            camera: video,
            screenShare: screenShare !== undefined ? screenShare : optionsRef.current.screenShare
          };
          if (screenShare && rtcRef.current.isScreenSharing) {
            setOptions({ ...optionsRef.current, screenShare: true });
            updatedVideo.stream = newStream;
            if (!newStream.getVideoTracks()[0]) return;
            newStream.getVideoTracks()[0].onended = () => {
              setOptions({ ...optionsRef.current, screenShare: false });
              if (!rtcRef.current) return;
              rtcRef.current.isScreenSharing = false;
              rtcRef.current.getMyStream(video, audio, audioDevice?.deviceId, videoDevice?.deviceId)?.then((stream) => {
                rtcRef.current?.replaceStream(stream);
                if (rtcRef.current) {
                  rtcRef.current.myStream = stream;
                }

                const newOldVideos = [...videosRef.current];
                const myNewVideo = newOldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);
                if (myNewVideo) {
                  newOldVideos.splice(newOldVideos.indexOf(myNewVideo), 1, {
                    ...myNewVideo,
                    stream,
                    screenShare: false
                  });
                  setVideos(newOldVideos);
                }
              });
            };
          }
          oldVideos.splice(oldVideos.indexOf(myVideo), 1, updatedVideo);

          setVideos(oldVideos);
        }
        const payload: OutgoingPeerChangeMessage = {
          code: 3015,
          peerId: rtcRef.current.peerId,
          callId,
          audio,
          camera: video,
          screenShare: screenShare !== undefined ? screenShare : optionsRef.current.screenShare
        };

        socket.send(JSON.stringify(payload));
      });
  };

  const handleScreenShare = () => {
    if (!optionsRef.current.screenShare) {
      handleStreamChange(options.mic, options.camera, !options.screenShare);
    } else {
      setOptions({ ...optionsRef.current, screenShare: false });
      const tracks = rtcRef.current?.myStream.getTracks();
      tracks?.forEach((track) => track.stop());

      const { camera, mic, audioDevice, videoDevice } = optionsRef.current;
      rtcRef.current?.getMyStream(camera, mic, audioDevice?.deviceId, videoDevice?.deviceId)?.then((stream) => {
        rtcRef.current?.replaceStream(stream);
        if (rtcRef.current) {
          rtcRef.current.myStream = stream;
        }

        const newOldVideos = [...videosRef.current];
        const myNewVideo = newOldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);
        if (myNewVideo) {
          newOldVideos.splice(newOldVideos.indexOf(myNewVideo), 1, { ...myNewVideo, stream, screenShare: false });
          setVideos(newOldVideos);
        }
      });
    }
  };

  const handleDeviceSwitch = (deviceId: string) => {
    const { mic, camera } = optionsRef.current;

    const thisDevice = devices.find((device) => device.deviceId === deviceId);

    if (!thisDevice) return;

    const key = thisDevice.kind === 'audioinput' ? 'audioDevice' : 'videoDevice';
    const newOptions = { ...options, [key]: thisDevice };
    setOptions(newOptions);
    rtcRef.current
      ?.getMyStream(camera, mic, newOptions.audioDevice?.deviceId, newOptions.videoDevice?.deviceId)
      ?.then((newStream) => {
        rtcRef.current?.replaceStream(newStream);
        const oldVideos = [...videosRef.current];
        const myVideo = oldVideos.find((vid) => vid.peerId === rtcRef.current?.peerId);
        if (!myVideo) return;
        myVideo.stream = newStream;
        oldVideos.splice(oldVideos.indexOf(myVideo), 1, myVideo);

        setVideos(oldVideos);
      });
  };
  useEffect(() => {
    const rtc = new RTCconnection(callId);
    rtcRef.current = rtc;

    const ws = socket.connect();

    const { mic, camera } = options;

    navigator.mediaDevices.enumerateDevices().then((d) => {
      const bestVideoDevice = d.find((device) => device.kind === 'videoinput');
      const bestAudioDevice = d.find((device) => device.kind === 'audioinput');

      setOptions({ ...optionsRef.current, videoDevice: bestVideoDevice, audioDevice: bestAudioDevice });
      setDevices(d);
    });
    const onOpen = (id) => {
      rtc.getMyStream(camera, mic, undefined, undefined)?.then((stream) => {
        if (stream) {
          rtc.streaming = true;
          rtc.myStream = stream;
          createVideo(id, stream, camera, true, false, true, meData?.me?.username);
        }

        rtc.peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (userVideoStream) => {
            createVideo(call.metadata.id, userVideoStream, true, true, false, false, call.metadata.username);
          });
          call.on('close', () => {
            removeVideo(call.metadata.id);
          });
          call.on('error', () => {
            removeVideo(call.metadata.id);
          });

          rtc.peers.push(call);
        });

        const handleMessage = (e) => {
          const { data: m } = e;
          const incoming = JSON.parse(m);

          if (incoming.code === 3012) {
            const { user, peerId } = incoming as IncomingJoinCallMessage;
            const call = rtc.peer.call(peerId, stream, {
              metadata: { id: rtc.peer.id, username: meData?.me?.username }
            });

            call?.on('stream', (userVideoStream) => {
              const hasAudio = userVideoStream.getAudioTracks().find((track) => track.enabled);
              const hasVideo = userVideoStream.getVideoTracks().find((track) => track.enabled);

              createVideo(peerId, userVideoStream, !!hasAudio, !!hasVideo, false, false, user.username);
            });
            call?.on('close', () => {
              removeVideo(peerId);
            });
            call?.on('error', () => {
              removeVideo(peerId);
            });

            rtc.peers.push(call);
          } else if (incoming.code === 3013) {
            setIsInCall(false);
            rtc.close();
          } else if (incoming.code === 3015) {
            const { peerId, userId, camera: cam, audio, screenShare } = incoming as IncomingPeerChangeMessage;
            const oldVideos = [...videosRef.current];
            let thisVideo = oldVideos.find((video) => video.peerId === peerId);
            if (!thisVideo) return;
            thisVideo = {
              ...thisVideo,
              camera: cam,
              mic: audio,
              screenShare
            };
            oldVideos.splice(oldVideos.indexOf(thisVideo), 1, thisVideo);
            setVideos(oldVideos);
          }
        };
        ws.addEventListener('message', handleMessage);

        const payload: OutgoingJoinCallMessage = {
          code: 3012,
          callId,
          peerId: id
        };
        socket.send(JSON.stringify(payload));
      });
    };
    rtc.peer.on('open', onOpen);

    return () => {
      setVideos([]);
      rtc.peer.off('open', onOpen);
      rtc.close();
    };
  }, []);

  const changeVolume = () => {
    setOptions({ ...optionsRef.current, volume: volumeRef.current });
  };

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
          {videos.map((video) => {
            return (
              <Video
                isMe={video.isMe}
                key={video.peerId}
                stream={video.stream}
                peerId={video.peerId}
                camera={video.camera}
                mic={video.mic}
                screenShare={video.screenShare}
                username={video.username}
                volume={options.volume}
                isDeafened={options.isDeafened}
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
              (options.camera ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title={options.camera ? 'Turn off your camera' : 'Turn on your camera'}
            onClick={() => handleStreamChange(options.mic, !options.camera, options.screenShare)}
          >
            <BiVideoOff size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (options.mic ? ' text-light-300 hover:bg-light-400' : ' text-black bg-red-500 border-none')
            }
            title={options.mic ? 'Mute your microphone' : 'Unmute your microphone'}
            onClick={() => handleStreamChange(!options.mic, options.camera, options.screenShare)}
          >
            <AiOutlineAudioMuted size={20} />
          </button>
          <button
            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex flex-col justify-center items-center mx-2"
            title="Leave call"
            onClick={() => {
              leaveCall(
                { options: { callId } },
                {
                  onSuccess: (d) => {
                    if (d.LeaveCall.errors.length > 0) {
                      d.LeaveCall.errors.forEach((err) => {
                        errorToast(err.details?.message);
                      });
                    }
                    setIsInCall(false);
                  }
                }
              );
            }}
          >
            <HiPhoneMissedCall size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (options.isDeafened ? ' text-black bg-red-500 border-none' : ' text-light-300 hover:bg-light-400')
            }
            title="Volume off"
            onClick={() => setOptions({ ...options, isDeafened: !options.isDeafened })}
          >
            <VscMute size={20} />
          </button>
          <button
            className={
              'w-12 h-12 bg-transparent border-2 border-light-300 rounded-full flex flex-col justify-center items-center mx-2 hover:text-black transition-all delay-75' +
              (options.screenShare ? ' text-black bg-red-500 border-none' : ' text-light-300 hover:bg-light-400')
            }
            title={options.screenShare ? 'Cancel screen sharing' : 'Share your screen'}
            onClick={() => handleScreenShare()}
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
                            handleDeviceSwitch(e.target.value);
                          }}
                        >
                          {devices.map((device) => {
                            if (device.kind !== 'audioinput') return null;
                            const isSelected = device.deviceId === optionsRef.current.audioDevice?.deviceId;
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
                            handleDeviceSwitch(e.target.value);
                          }}
                        >
                          {devices.map((device) => {
                            if (device.kind !== 'videoinput') return null;
                            const isSelected = device.deviceId === optionsRef.current.videoDevice?.deviceId;
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
                          onMouseUp={changeVolume}
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
