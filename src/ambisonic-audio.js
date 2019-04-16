/* global DEBUG */
import * as AFRAME from 'aframe';
import * as THREE from 'three';
import Omnitone from 'omnitone';

const log = AFRAME.utils.debug('components:ambisonic:info');
const warn = AFRAME.utils.debug('components:ambisonic:warn');

function setBooleanAttribute(element, attr, value) {
	if (element) {
		if (value) {
			element.setAttribute(attr, true);
		} else {
			element.removeAttribute(attr);
		}
	}
}

const safariChannelMap = ([w, x, y, z]) => [y, w, x, z];

AFRAME.registerComponent('ambisonic', {
	schema: {
		src: { type: 'audio' },
		loop: { type: 'boolean', default: true },
		autoplay: { type: 'boolean', default: false },
		useMediaElement: { type: 'boolean', default: true },
		channels: { type: 'number', default: 4 }, // todo: change to 'order'?
		channelMap: { type: 'array', default: [0, 1, 2, 3] },
		mode: {
			default: 'ambisonic',
			oneOf: [
				'bypass',
				'ambisonic',
				'off'
			]
		}
	},

	init() {
		this.context = null;
		this.renderer = null;
		this.audio = null;
		this.mediaElement = null;

		this.ownMediaElement = false;

		// bind any event handling methods
		this.setCamera = this.setCamera.bind(this);
		this.resumeAudioContext = this.resumeAudioContext.bind(this);
		this.onEntityChange = this.onEntityChange.bind(this);

		// Update on entity change.
		this.el.addEventListener('componentchanged', this.onEntityChange);
	},

	update(oldData) {
		const el = this.el;
		const sceneEl = el.sceneEl;
		// todo: handle changed scene element

		// try to get context from scene audio listener. otherwise, make our own
		const listener = sceneEl.audioListener;
		const context = listener && listener.context || this.context || THREE.AudioContext.getContext();

		// Wait for camera if necessary. todo: remove this later
		this.camera = sceneEl.camera || null;
		sceneEl.addEventListener('camera-set-active', this.setCamera);

		// if context changed, then need to rebuild omnitone instance
		// todo: rebuild if type of Omnitone renderer (order) changed
		const {
			channels,
			useMediaElement,
			src
		} = this.data;
		const rebuildOmnitone = context !== this.context ||
			!this.renderer ||
			this.renderer.input.channelCount > 4 !== channels >= 4;

		if (rebuildOmnitone) {
			this.context = context;
			this.resumeAudioContext();

			if (this.renderer) {
				// clean up old renderer
				this.renderer.output.disconnect();
				this.renderer = null;
			}

			const createRenderer = channels === 4 ?
				Omnitone.createFOARenderer :
				Omnitone.createHOARenderer;

			const renderer = this.renderer = createRenderer(this.context);
			renderer.initialize().then(() => {
				if (renderer !== this.renderer || context !== this.context) {
					// things changed while we were initializing so abort
					return;
				}

				this.audio.gain.connect(this.renderer.input);
				renderer.output.connect(context.destination);

				this.updateAmbisonicSettings();
			});

			this.audio = new THREE.Audio(listener || {
				context,
				getInput: () => context.destination
			});
			this.audio.gain.disconnect();
		}

		const rebuildSound = rebuildOmnitone ||
			!!oldData.useMediaElement !== !!useMediaElement ||
			oldData.src !== src;

		if (rebuildSound) {
			if (useMediaElement) {
				let newMediaElement = null;
				if (src instanceof window.HTMLMediaElement) {
					newMediaElement = src;
					newMediaElement.addEventListener('play', this.resumeAudioContext);
					this.ownMediaElement = false;
				} else {
					newMediaElement = this.mediaElement || document.createElement('audio');
					newMediaElement.src = src;
					// this.mediaElement.load();
					this.ownMediaElement = true;
				}
				if (this.mediaElement !== newMediaElement) {
					this.cleanMediaAssets();
				}

				if (DEBUG && !this.mediaElement && newMediaElement && this.ownMediaElement) {
					newMediaElement.onerror = evt => {
						warn('Error loading audio', src, evt);
					};
					newMediaElement.onloadedmetadata = () => {
						log('Audio metadata loaded', src, this.mediaElement);
					};
				}
				this.mediaElement = newMediaElement;
				this.audio.setMediaElementSource(this.mediaElement);
			} else {
				// todo: load buffer
			}
		}

		this.updatePlaybackSettings();
		this.updateAmbisonicSettings();
	},

	tick() {
		if (this.renderer && this.camera) {
			this.renderer.setRotationMatrixFromCamera(this.camera.matrixWorld);
		}
	},

	play() {
		if (this.data.autoplay) {
			this.playSound();
		}
	},

	pause() {
		this.pauseSound();
	},

	cleanMediaAssets() {
		// clean up all sound assets
		if (this.mediaElement) {
			this.mediaElement.removeEventListener('play', this.resumeAudioContext);
			if (this.ownMediaElement) {
				this.mediaElement.pause();
				this.mediaElement.src = '';
				this.mediaElement.load();
			}
			this.mediaElement = null;
		}
	},

	remove() {
		const el = this.el;
		const sceneEl = el && el.sceneEl;
		if (sceneEl) {
			sceneEl.removeEventListener('camera-set-active', this.setCamera);
		}
		this.el.removeEventListener('componentchanged', this.onEntityChange);
		this.disconnect();
		this.cleanMediaAssets();
	},

	setCamera(evt) {
		console.log('setCamera', evt);
		this.camera = evt.detail.cameraEl.getObject3D('camera');
	},

	// resume audio context
	resumeAudioContext() {
		if (this.context && this.context.resume) {
			this.context.resume().catch(() => {});
		}
	},

	// set play state to start when loaded
	playSound() {
		this.resumeAudioContext();
		if (this.mediaElement) {
			this.mediaElement.play();
		} else if (this.audio && !this.audio.isPlaying) {
			this.audio.play();
		}
	},

	pauseSound() {
		if (this.mediaElement) {
			this.mediaElement.pause();
		} else if (this.audio && this.audio.isPlaying) {
			this.audio.pause();
		}
	},

	stopSound() {
		if (this.mediaElement) {
			this.mediaElement.pause();
		} else if (this.audio) {
			this.audio.stop();
		}
	},

	/**
	* Update the Omnitone sound settings.
	*/
	updateAmbisonicSettings() {
		if (this.renderer) {
			const channelMap = this.data.channelMap.map(parseFloat);
			this.renderer.setChannelMap(
				channelMap.length === 4 && /safari/i.test(Omnitone.browserInfo) ?
					safariChannelMap(channelMap) :
					channelMap
			);
			this.renderer.setRenderingMode(this.data.mode);
		}
	},

	/**
	* Update the playback settings.
	*/
	updatePlaybackSettings() {
		if (this.mediaElement) {

			// todo: only if we created this element
			setBooleanAttribute(this.mediaElement, 'loop', this.data.loop);
			setBooleanAttribute(this.mediaElement, 'autoplay', this.data.autoplay);
		} else if (this.audio) {
			this.audio.setLoop(this.data.loop);
		}
		// todo: other props like playbackRate, detune, etc.
	},


	/**
	* When the entity's rotation is changed, update the Omnitone rotation accordingly.
	* @param {Event} evt
	*/
	onEntityChange(evt) {
		if (evt.detail.name !== 'rotation') {
			return;
		}

		this.el.sceneEl.object3D.updateMatrixWorld(true);
		// todo: support rotating entity
	},

	disconnect() {
		if (this.audio) {
			this.audio.disconnect();
			this.audio.gain.disconnect();
		}
		if (this.renderer) {
			this.renderer.input.disconnect();
			this.renderer.output.disconnect();
		}
	}
});

AFRAME.registerPrimitive('a-ambisonic', {
	defaultComponents: {
		'ambisonic': {}
	},
	mappings: {
		src: 'ambisonic.src',
		loop: 'ambisonic.loop',
		autoplay: 'ambisonic.autoplay',
		'use-media-element': 'ambisonic.useMediaElement',
		'channel-map': 'ambisonic.channelMap',
		mode: 'ambisonic.mode'
	}
});
