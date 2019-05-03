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

const MIN_ORDER = 1;
const MAX_ORDER = 3;
const isSafari = false;// /safari/i.test(Omnitone.browserInfo.name);
const isIOS = false;// /iP(ad|od|hone)/.test(Omnitone.browserInfo.platform);
const safariChannelMap = ([w, x, y, z]) => [y, w, x, z];

function setRotationMatrixFromCamera(renderer, camera) {
	renderer.setRotationMatrix4(camera.matrixWorldInverse.elements);
}

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
		sources: { type: 'array', default: [] },
		loop: { type: 'boolean', default: true },
		autoplay: { type: 'boolean', default: false },
		useMediaElement: { type: 'boolean', default: true },
		order: { type: 'number', default: 1 },
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
		this.audioSources = [];
		this.loading = false;

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
			order,
			src,
			sources
		} = this.data;

		const orderPlus1 = order + 1;
		const channels = orderPlus1 * orderPlus1;
		const useMediaElement = this.data.useMediaElement &&
			(!sources || !(sources.length >= 2));

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

			const renderer = this.renderer = createRenderer(this.context, { ambisonicOrder: order });

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
			oldData.src !== src ||
			JSON.stringify(oldData.sources) !== JSON.stringify(sources);

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
					newMediaElement.addEventListener('canplay', this.onLoadSound);
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
				this.audioSources = [];
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

				if (sources && sources.length) {
					this.audioSources = sources;
				} else {
					this.audioSources = [url];
				}
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
			setRotationMatrixFromCamera(this.renderer, this.camera);
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
			this.mediaElement.removeEventListener('canplay', this.onLoadSound);
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
		if (this.loading) {
			// todo: find a way to abort loader
			this.loading = false;
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
			if (this.loading || !this.audioSources.length) {
				return;
			}

			this.loading = true;
			const sources = JSON.stringify(this.audioSources);
			Omnitone.createBufferList(this.context, this.audioSources)
				.then(results => {
					const audioBuffer = Omnitone.mergeBufferListByChannel(this.context, results);
					if (!this.data.useMediaElement && sources === JSON.stringify(this.audioSources)) {
						this.audio.setBuffer(audioBuffer);
						this.onLoadSound();
						this.updatePlaybackSettings();
						if (this.playing) {
							this.playSound();
						}
					}
				})
				.catch(error => {
					warn('Unable to decode audio source', this.audioSources, error);
				});
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

			if (this.renderer.setChannelMap) {
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
			}

			// Mobile Safari cannot decode all the audio channels from a media element
			const { order, mode } = this.data;
			const validOrder = order >= MIN_ORDER && order <= MAX_ORDER;
			const renderingMode = (isIOS || !validOrder) && mode === 'ambisonic' ?
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
		sources: 'ambisonic.sources',
		loop: 'ambisonic.loop',
		autoplay: 'ambisonic.autoplay',
		order: 'ambisonic.order',
		'use-media-element': 'ambisonic.useMediaElement',
		'channel-map': 'ambisonic.channelMap',
		mode: 'ambisonic.mode'
	}
});
