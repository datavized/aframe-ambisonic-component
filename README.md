## aframe-ambisonic-component

[![Version](http://img.shields.io/npm/v/aframe-ambisonic-component.svg?style=flat-square)](https://npmjs.org/package/aframe-ambisonic-component)
[![License](http://img.shields.io/npm/l/aframe-ambisonic-component.svg?style=flat-square)](https://npmjs.org/package/aframe-ambisonic-component)

An Ambisonic Audio component for [A-Frame](https://aframe.io).

Built on [Omnitone](https://github.com/GoogleChrome/omnitone).

### API

| Property | Description | Default Value | Values |
| -------- | ----------- | ------------- | ------ |
| `src`    | The source of the audio. This can be an [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) (`<audio />` or `<video />`), an ID string pointing to an HTMLMediaElement or a resouce string. | |
| `sources` | Load multiple audio files<sup>[1](#sources-footnote)</sup>. Overrides `src`. | | Array of URL strings |
| `loop` | Whether to loop the element source. Overwrites the value set by the input element. | true | |
| `useMediaElement` | Whether to use a media element (required for video). Alternatively, load from source as an [audio buffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer). | true | |
| `autoplay` | Whether to autoplay the element source. Overwrites the value set by the input element. | true | |
| `mode` | Audio rendering mode | `ambisonic` | [oneOf(`ambisonic`, `bypass`, `off`)] |
| `order` | Order of ambisonic rendering | 1 | 1, 2 or 3 |
| `channelMap` | Ordering of [ambisonic component channels](https://en.wikipedia.org/wiki/Ambisonic_data_exchange_formats#Component_ordering) | `ACN` | [oneOf([`ACN`](https://en.wikipedia.org/wiki/Ambisonic_data_exchange_formats#ACN "Ambisonic Channel Number")), [`FuMa`](https://en.wikipedia.org/wiki/Ambisonic_data_exchange_formats#Furse-Malham "Furse-Malham"), [`SID`](https://en.wikipedia.org/wiki/Ambisonic_data_exchange_formats#SID "Single Index Designation")] or Array of integers |

<a name="sources-footnote">1</a>: Higher-order ambisonic audio requires 9 or 16 channels, but most browsers can only decode 8 channels at a time. So it is necessary to split the audio file into two: each with no more than 8 channels. See Higher Order Ambisonics example.

### Installation

#### Browser

Install and use by directly including the script compiled for the browser:

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/1.0.3/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-ambisonic-component"></script>
</head>

<body>
  <a-scene>
    <a-assets>
      <audio id="audio" src="audiofile.mp4"></audio>
    </a-assets>
    <a-ambisonic src="#audio"></a-entity>
  </a-scene>
</body>
```

If you already have Omnitone loaded or if you're using another component that loads Omnitone (e.g. [aframe-resonance-audio-component](https://github.com/digaverse/aframe-resonance-audio-component)), there is a much smaller version of the script that does not include Omnitone.

```html
<script src="https://unpkg.com/aframe-ambisonic-component/build/aframe-ambisonic-component-no-omnitone.min.js"></script>
```

#### npm

Install via npm:

```bash
npm install aframe-ambisonic-component
```

Then require and use.

```js
require('aframe');
require('aframe-ambisonic-component');
```
