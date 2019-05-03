/* global AFRAME */
AFRAME.registerComponent('play-on-vrdisplayactivate-or-enter-vr', {
	init: function () {
		this.playMedia = this.playMedia.bind(this);
		this.playMediaNextTick = this.playMediaNextTick.bind(this);
	},
	play: function () {
		window.addEventListener('vrdisplayactivate', this.playMedia);
		this.el.sceneEl.addEventListener('enter-vr', this.playMediaNextTick);
	},
	pause: function () {
		this.el.sceneEl.removeEventListener('enter-vr', this.playMediaNextTick);
		window.removeEventListener('vrdisplayactivate', this.playMedia);
	},
	playMediaNextTick: function () {
		setTimeout(this.playMedia);
	},
	playMedia: function () {
		var components = this.el.components;
		var image;
		if (components.ambisonic) {
			components.ambisonic.playSound();
		} else if (components.sound) {
			components.sound.playSound();
		} else if (components.material) {
			try {
				image = components.material.material.map.image;
				image.play();
			} catch (e) {}
		}
	}
});