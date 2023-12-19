# Bioengine web client

Standalone web client for run models on Bioengine.

Online demo: https://bioimage-io.github.io/bioengine-web-client/

![demo](./screenshot_bwc.png)

Functionality:

- Using ImageJ.js as a viewer and preprocessor.
- Loading and displaying sample input and output images for a specific model.
- Submitting images to Bioengine and displaying results.
- Image tiler allows to run model on large images.
- Export ImJoy API for using as a plugin in ImJoy.

## Development

```bash
$ npm install -g pnpm  # install pnpm globally
$ pnpm install         # install dependencies
$ pnpm run dev         # serve with hot reload
```
