/* global AFRAME */
AFRAME.registerComponent('play-on-window-click', {
	init: function () {
		this.onClick = this.onClick.bind(this);
	},
	play: function () {
		window.addEventListener('mousedown', this.onClick);
		document.addEventListener('touchstart', this.onClick);
	},
	pause: function () {
		window.removeEventListener('mousedown', this.onClick);
		document.removeEventListener('touchstart', this.onClick);
	},
	onClick: function () {
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