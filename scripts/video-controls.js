(function () {
	var video = document.getElementById('video');
	var playButton = document.getElementById('play');
	var rewindButton = document.getElementById('rewind');

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