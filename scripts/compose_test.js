(async ()=>{
  try{
    const vc = require('../src/services/videoComposer');
    const gameplay = require('path').join(__dirname, '..', 'assets', 'sample_gameplay.mp4');
    const audio = '/home/server/.ai-video-story-gen/audio/narration_silent_1780083239796.wav';
    console.log('Starting composeVideo test...');
    const out = await vc.composeVideo({
      gameplayPath: gameplay,
      audioPath: audio,
      outputFilename: 'test_output.mp4',
      duration: 10,
      addCaptions: false,
      storyText: 'This is a caption test for the AI Story Generator.'
    });
    console.log('Compose result:', out);
  }catch(e){
    console.error('Compose test failed:', e);
    process.exit(1);
  }
})();
