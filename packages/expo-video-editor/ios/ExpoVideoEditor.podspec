Pod::Spec.new do |s|
  s.name           = 'ExpoVideoEditor'
  s.version        = '0.1.0'
  s.summary        = 'High-performance Stories-style video editor for Expo/React Native'
  s.description    = 'Native video editing (trim, color filters, text/GIF overlays, audio mixing) built on AVFoundation with a hardware-encoded single-pass export.'
  s.author         = 'Gleidson Daniel'
  s.homepage       = 'https://github.com/GleidsonDaniel/expo-video-editor'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: 'https://github.com/GleidsonDaniel/expo-video-editor.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
