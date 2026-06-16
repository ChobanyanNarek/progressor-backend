export interface IDidCreateTalk {
  sourceUrl: string;
  /**
   * Signed URL of an uploaded voice. When present the talk uses an audio script
   * (the real voice). Takes precedence over {@link scriptText}.
   */
  audioUrl?: string;
  /**
   * Text the avatar should speak. Used when no audio is provided — D-ID
   * synthesizes the voice with its default TTS. Exactly one of `audioUrl` /
   * `scriptText` must be set.
   */
  scriptText?: string;
  userData: string;
}
