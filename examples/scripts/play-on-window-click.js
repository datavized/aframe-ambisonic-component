/* global AFRAME */
AFRAME.registerComponent('play-on-window-click', {
	init: function () {
		this.onClick = this.onClick.bind(this);
	},
	play: function () {
		window.addEventListener('click', this.onClick);
	},
	pause: function () {
		window.removeEventListener('click', this.onClick);
	},
	onClick: function () {
		const components = this.el.components;
		if (components.ambisonic) {
			components.ambisonic.playSound();
		} else if (components.sound) {
			components.sound.playSound();
		} else if (components.material) {
			try {
				const image = components.material.material.map.image;
				image.play();
			} catch (e) {}
		}
	}
});