(async ()=>{
  try{
    process.env.FORCE_SILENT_TTS='1';
    const tts = require('../src/services/tts');
    console.log('Calling generateAudio...');
    const p = await tts.generateAudio('This is a forced silent TTS test from test script.');
    console.log('Result path:', p);
  }catch(e){
    console.error('Error:', e);
    process.exit(1);
  }
})();
