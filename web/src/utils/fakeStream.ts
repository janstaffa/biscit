export const createEmptyAudioTrack = () => {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  return Object.assign(track, { enabled: false });
};

export const createEmptyVideoTrack = ({ width, height }) => {
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillRect(0, 0, width, height);

  const stream = canvas.captureStream();
  const track = stream.getVideoTracks()[0];

  track.enabled = false;
  return track;
};

export const getEmptyStream = () => {
  const audioTrack = createEmptyAudioTrack();
  const videoTrack = createEmptyVideoTrack({ width: 1280, height: 720 });

  const mediaStream = new MediaStream();
  mediaStream.addTrack(audioTrack);
  if (videoTrack) {
    mediaStream.addTrack(videoTrack);
  }
  return mediaStream;
};
