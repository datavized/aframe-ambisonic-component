## aframe-ambisonic-component

[![Version](http://img.shields.io/npm/v/aframe-ambisonic-component.svg?style=flat-square)](https://npmjs.org/package/aframe-ambisonic-component)
[![License](http://img.shields.io/npm/l/aframe-ambisonic-component.svg?style=flat-square)](https://npmjs.org/package/aframe-ambisonic-component)

An Ambisonic Audio component for [A-Frame](https://aframe.io).

Built on [Omnitone](https://github.com/GoogleChrome/omnitone).

### API

| Property | Description | Default Value | Values |
| -------- | ----------- | ------------- | ------ |
| `src`    | The source of the audio. This can be a [HTMLMediaElement] (`<audio />` or `<video />`), an ID string pointing to a [HTMLMediaElement] or a resouce string. | |
| `loop` | Whether to loop the element source. Overwrites the value set by the input element. | true | |
| `autoplay` | Whether to autoplay the element source. Overwrites the value set by the input element. | true | |
| `mode` | Audio rendering mode | `ambisonic` | [oneOf(`ambisonic`, `bypass`, `off`)] |

### Installation

#### Browser

Install and use by directly including the [browser files](build):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.9.0/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-ambisonic-component/dist/aframe-ambisonic-component.min.js"></script>
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
<script src="https://unpkg.com/aframe-ambisonic-component/dist/aframe-ambisonic-component-no-omnitone.min.js"></script>
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
