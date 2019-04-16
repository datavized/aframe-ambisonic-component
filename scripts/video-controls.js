(function () {
	const video = document.getElementById('video');
	const playButton = document.getElementById('play');
	const rewindButton = document.getElementById('rewind');

	playButton.addEventListener('click', function () {
		if (video.paused) {
			video.play();
		} else {
			video.pause();
		}
	});

	rewindButton.addEventListener('click', function () {
		if (video.duration) {
			video.currentTime = 0;
		}
	});

	video.addEventListener('play', function () {
		playButton.textContent = 'Pause';
	});

	video.addEventListener('pause', function () {
		playButton.textContent = 'Play';
	});
}());