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

const isSafari = false;// /safari/i.test(Omnitone.browserInfo.name);
const isIOS = false;// /iP(ad|od|hone)/.test(Omnitone.browserInfo.platform);
const safariChannelMap = ([w, x, y, z]) => [y, w, x, z];

const boundMethods = [
	'setCamera',
	'onEntityChange',
	'onLoadSound',
	'onPlaySound',
	'onPauseSound',
	'onEndSound'
];

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
		this.audioSource = '';
		this.loader = null;

		this.ownMediaElement = false;
		this.playing = false;

		// bind any event handling methods
		boundMethods.forEach(name => {
			this[name] = this[name].bind(this);
		});

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
				if (newMediaElement) {
					newMediaElement.addEventListener('play', this.onPlaySound);
					newMediaElement.addEventListener('pause', this.onPauseSound);
					newMediaElement.addEventListener('load', this.onLoadSound);
					newMediaElement.addEventListener('ended', this.onEndSound);
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
				this.audioSource = '';
				this.audio.setMediaElementSource(this.mediaElement);
			} else {
				// load audio buffer

				let url = src;
				if (src && typeof src !== 'string' && src instanceof window.HTMLMediaElement) {
					if (src.tagName.toLowerCase() === 'video') {
						throw new Error('Unable to load video as audio buffer');
					}
					url = src.src || src.srcObject || src.currentSrc;
				}

				this.audioSource = url;
				this.cleanMediaAssets();
				if (this.data.autoplay) {
					this.loadBuffer();
				}
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
			this.mediaElement.removeEventListener('play', this.playSound);
			this.mediaElement.removeEventListener('pause', this.onPauseSound);
			this.mediaElement.removeEventListener('load', this.onLoadSound);
			this.mediaElement.removeEventListener('ended', this.onEndSound);
			if (this.ownMediaElement) {
				this.mediaElement.pause();
				this.mediaElement.src = '';
				this.mediaElement.load();
			}
			this.mediaElement = null;
		}
		if (this.audio) {
			if (this.audio.isPlaying) {
				this.audio.stop();
			}
			if (this.audio.source) {
				this.audio.source.removeEventListener('ended', this.onEndSound);
			}
			this.audio.source = null;
			this.audio.buffer = null;
			this.audio.sourceType = 'empty';
		}
		if (this.loader) {
			this.loader.abort();
			this.loader = null;
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
		this.camera = evt.detail.cameraEl.getObject3D('camera');
	},

	// resume audio context
	resumeAudioContext() {
		if (this.context && this.context.resume && this.context.state === 'suspended') {
			return this.context.resume().catch(() => {});
		}

		return Promise.resolve();
	},

	loadBuffer() {
		this.resumeAudioContext().then(() => {
			const url = this.audioSource;
			if (this.loader || !url) {
				return;
			}

			const loader = this.loader = new XMLHttpRequest();
			loader.responseType = 'arraybuffer';
			loader.onload = () => {
				this.context.decodeAudioData(loader.response, audioBuffer => {
					if (this.audioSource === url && !this.data.useMediaElement) {
						this.audio.setBuffer(audioBuffer);
						this.onLoadSound();
						this.updatePlaybackSettings();
						if (this.playing) {
							this.playSound();
						}
					}
				}, error => {
					this.loader = null;
					warn('Unable to decode audio source', url, error);
				});
			};
			loader.onerror = evt => {
				this.loader = null;
				warn('Unable to load audio source', url, evt, loader);
			};
			loader.open('GET', url);
			loader.send();
		});
	},

	// set play state to start when loaded
	playSound() {
		this.playing = true;
		this.resumeAudioContext();
		if (this.mediaElement) {
			const playPromise = this.mediaElement.play();
			if (playPromise) {
				playPromise.catch(e => {
					warn('Unable to play media', e.message);
				});
			}
		} else if (this.audio && !this.audio.isPlaying) {
			this.loadBuffer();
			if (this.audio.buffer) {
				this.audio.play();
				this.audio.source.addEventListener('ended', this.onEndSound);
				this.onPlaySound();
			}
		}
	},

	pauseSound() {
		this.playing = false;
		if (this.mediaElement) {
			this.mediaElement.pause();
		} else if (this.audio && this.audio.isPlaying) {
			this.audio.pause();
			this.onPauseSound();
		}
	},

	stopSound() {
		if (this.mediaElement) {
			this.mediaElement.pause();
		} else if (this.audio) {
			this.audio.stop();
			this.onPauseSound();
		}
	},

	onPlaySound() {
		this.resumeAudioContext();
		this.el.emit('sound-play');
	},

	onPauseSound() {
		this.el.emit('sound-pause');
	},

	onLoadSound() {
		this.el.emit('sound-loaded');
	},

	onEndSound() {
		if (this.audio && this.audio.source) {
			this.onPauseSound();
			this.audio.source.removeEventListener('ended', this.onEndSound);
		}
		this.el.emit('sound-ended');
	},

	/**
	* Update the Omnitone sound settings.
	*/
	updateAmbisonicSettings() {
		if (this.renderer) {
			const channelMap = this.data.channelMap.map(parseFloat);

			/*
			Per various documents on the internet, Safari messes up the
			order of the channels, but that does not seem to be the case.
			Maybe it's been fixed in a recent version, so this is disabled
			for now.
			*/
			this.renderer.setChannelMap(
				channelMap.length === 4 && isSafari ?
					safariChannelMap(channelMap) :
					channelMap
			);

			// Mobile Safari cannot decode all the audio channels from a media element
			const renderingMode = isIOS && this.data.mode === 'ambisonic' ?
				'bypass' :
				this.data.mode;
			this.renderer.setRenderingMode(renderingMode);
		}
	},

	/**
	* Update the playback settings.
	*/
	updatePlaybackSettings() {
		if (this.mediaElement) {

			// only if we created this element
			if (this.ownMediaElement) {
				setBooleanAttribute(this.mediaElement, 'loop', this.data.loop);
				setBooleanAttribute(this.mediaElement, 'autoplay', this.data.autoplay);
			}
		} else if (this.audio) {
			this.audio.setLoop(this.data.loop);
			this.audio.autoplay = this.data.autoplay;
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
