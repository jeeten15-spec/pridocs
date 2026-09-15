/** Chrome / Edge extensions for system audio capture via getDisplayMedia */
interface DisplayMediaStreamOptions extends MediaStreamConstraints {
  video?: boolean | MediaTrackConstraints
  audio?: boolean | MediaTrackConstraints
  systemAudio?: 'include' | 'exclude'
  preferCurrentTab?: boolean
  selfBrowserSurface?: 'include' | 'exclude'
  surfaceSwitching?: 'include' | 'exclude'
}
