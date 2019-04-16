AFRAME.registerComponent('hide-once-playing', {
	schema: {
		type: 'selector'
	},
	init: function () {
		this.mediaElement = null;
		this.onPlaying = this.onPlaying.bind(this);
		this.onPause = this.onPause.bind(this);
	},
	update: function () {
		var data = this.data;
		if (data) {
			var mediaElement = data.components && data.components.ambisonic && data.components.ambisonic.mediaElement ||
				data instanceof window.HTMLMediaElement && data ||
				null;

			if (this.mediaElement !== mediaElement) {
				this.removeEvents();
				this.mediaElement = mediaElement;
				if (this.isPlaying) {
					this.addEvents();
				}
			}
		}
	},
	addEvents: function () {
		if (this.mediaElement) {
			if (this.mediaElement.paused) {
				this.onPause();
			} else {
				this.onPlaying();
			}
			this.mediaElement.addEventListener('play', this.onPlaying);
			this.mediaElement.addEventListener('pause', this.onPause);
		}
	},
	removeEvents: function () {
		if (this.mediaElement) {
			this.mediaElement.removeEventListener('play', this.onPlaying);
			this.mediaElement.removeEventListener('pause', this.onPause);
		}
	},
	play: function () {
		this.addEvents();
	},
	pause: function () {
		this.removeEvents();
	},
	onPlaying: function (evt) {
		this.el.setAttribute('visible', false);
	},
	onPause: function (evt) {
		this.el.setAttribute('visible', true);
	}
});