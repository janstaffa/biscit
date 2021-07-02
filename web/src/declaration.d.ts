interface AudioNode extends AudioNode {
  stream: MediaStream;
}
interface HTMLCanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}
