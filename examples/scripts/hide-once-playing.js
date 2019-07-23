/* global AFRAME */
AFRAME.registerComponent('hide-once-playing', {
	schema: {
		type: 'selector'
	},
	init: function () {
		this.mediaElement = null;
		this.onPlaying = this.onPlaying.bind(this);
		this.onPause = this.onPause.bind(this);
	},
	update: function (oldData) {
		var mediaElement;
		var data = this.data;
		if (data && data.components && data.components.ambisonic) {
			this.removeEvents(oldData);
			this.addEvents();
		} else if (data) {
			mediaElement = data instanceof window.HTMLMediaElement && data ||
				null;

			if (this.mediaElement !== mediaElement) {
				this.removeEvents(oldData);
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
		} else if (this.data && this.data.addEventListener) {
			this.data.addEventListener('sound-play', this.onPlaying);
			this.data.addEventListener('sound-pause', this.onPause);
		}
	},
	removeEvents: function (target = this.data) {
		if (this.mediaElement) {
			this.mediaElement.removeEventListener('play', this.onPlaying);
			this.mediaElement.removeEventListener('pause', this.onPause);
		}
		if (target && target.removeEventListener) {
			target.removeEventListener('sound-play', this.onPlaying);
			target.removeEventListener('sound-pause', this.onPause);
		}
	},
	play: function () {
		this.addEvents();
	},
	pause: function () {
		this.removeEvents();
	},
	onPlaying: function () {
		this.el.setAttribute('visible', false);
	},
	onPause: function () {
		this.el.setAttribute('visible', true);
	}
});