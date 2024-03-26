const { exec } = require('child_process');

const inputPlaylist = './667788.m3u8';
const outputPlaylist = './output.m3u8';

// FFmpeg command to create a new HLS playlist without the watermark
const ffmpegCommand = `ffmpeg -i ${inputPlaylist} -c copy -bsf:a aac_adtstoasc -vf "delogo=x=W-w-10:y=H-h-10:w=100:h=50" ${outputPlaylist}`;

exec(ffmpegCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Output: ${stdout}`);
  console.error(`Error: ${stderr}`);
  console.log('Watermark removed successfully.');
});
