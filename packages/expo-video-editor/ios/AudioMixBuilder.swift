import AVFoundation

enum AudioMixBuilder {
  static func build(source: AVURLAsset, payload: ExportPayload) async throws -> (AVMutableComposition, AVMutableAudioMix) {
    let composition = AVMutableComposition()

    let trimStart = CMTime(value: CMTimeValue(payload.startMs), timescale: 1000)
    let trimDuration: CMTime =
      payload.endMs > payload.startMs
      ? CMTime(value: CMTimeValue(payload.endMs - payload.startMs), timescale: 1000)
      : try await source.load(.duration)
    let trimRange = CMTimeRange(start: trimStart, duration: trimDuration)

    if let srcVideo = try await source.loadTracks(withMediaType: .video).first,
      let compVideo = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) {
      try compVideo.insertTimeRange(trimRange, of: srcVideo, at: .zero)
      compVideo.preferredTransform = try await srcVideo.load(.preferredTransform)
    }

    var parameters: [AVMutableAudioMixInputParameters] = []

    if let srcAudio = try await source.loadTracks(withMediaType: .audio).first,
      let compAudio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
      try compAudio.insertTimeRange(trimRange, of: srcAudio, at: .zero)
      let p = AVMutableAudioMixInputParameters(track: compAudio)
      p.setVolume(Float(payload.originalVolume), at: .zero)
      parameters.append(p)
    }

    if let audio = payload.audio, let musicURL = fileURL(audio.uri) {
      let musicAsset = AVURLAsset(url: musicURL)
      if let musicTrack = try await musicAsset.loadTracks(withMediaType: .audio).first,
        let compMusic = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
        let segStart = CMTime(value: CMTimeValue(audio.trimStartMs), timescale: 1000)
        let segEnd: CMTime =
          audio.trimEndMs > audio.trimStartMs
          ? CMTime(value: CMTimeValue(audio.trimEndMs), timescale: 1000)
          : try await musicAsset.load(.duration)
        let segDuration = CMTimeSubtract(segEnd, segStart)

        if segDuration.seconds > 0 {
          var inserted = CMTime.zero
          while inserted < trimDuration {
            let remaining = CMTimeSubtract(trimDuration, inserted)
            let chunk = CMTimeMinimum(segDuration, remaining)
            if chunk.seconds <= 0 { break }
            try compMusic.insertTimeRange(CMTimeRange(start: segStart, duration: chunk), of: musicTrack, at: inserted)
            inserted = CMTimeAdd(inserted, chunk)
            if !audio.loop { break }
          }
        }
        let p = AVMutableAudioMixInputParameters(track: compMusic)
        p.setVolume(Float(audio.volume), at: .zero)
        parameters.append(p)
      }
    }

    let mix = AVMutableAudioMix()
    mix.inputParameters = parameters
    return (composition, mix)
  }

  private static func fileURL(_ uri: String) -> URL? {
    uri.hasPrefix("/") ? URL(fileURLWithPath: uri) : (URL(string: uri) ?? URL(fileURLWithPath: uri))
  }
}
