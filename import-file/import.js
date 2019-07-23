(function () {
	var url = null;

	function handleFile(evt) {
		// var reader = new FileReader;
		var files = evt.dataTransfer && evt.dataTransfer.files || evt.target && evt.target.files;
		var file = files && files.length && files[0];
		var medium = file && file.type.split('/')[0];

		var ambisonicElement = document.getElementById('ambisonic');
		var ambisonic = ambisonicElement.components.ambisonic;

		evt.preventDefault();

		if (medium === 'video' || medium === 'audio') {
			ambisonic.pauseSound();
			if (url) {
				URL.revokeObjectURL(url);
			}
			url = URL.createObjectURL(file);
			ambisonicElement.setAttribute('src', url);
			ambisonic.playSound();
		}
		return false;
	}

	window.addEventListener('dragover', function (evt) {
		evt.preventDefault();
		return false;
	});
	window.addEventListener('drop', handleFile, true);

	document.getElementById('import-file').addEventListener('change', handleFile, false);
}());