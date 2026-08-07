export function initVideoPlayback() {
  document.querySelectorAll('[data-click-video]').forEach((root) => {
    const video = root.querySelector('video');
    const playButton = root.querySelector('[data-video-play]');

    if (!video || !playButton) return;

    video.controls = false;

    const updateState = () => {
      const isPlaying = !video.paused && !video.ended;

      root.classList.toggle('is-playing', isPlaying);
      playButton.disabled = isPlaying;
    };

    playButton.addEventListener('click', async () => {
      video.controls = true;

      try {
        await video.play();
      } catch {
        updateState();
      }
    });

    video.addEventListener('play', updateState);
    video.addEventListener('pause', updateState);
    video.addEventListener('ended', updateState);
    updateState();
  });
}
