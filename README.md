# Bioengine web client

Standalone web client for run models on Bioengine.
Directly run the advanced deep-learning models in the [bioimage.io](https://bioimage.io/#/) model zoo 🦒!

Online demo: https://bioimage-io.github.io/bioengine-web-client/

![demo](./screenshot_bwc.png)

Functionality:

- Using ImageJ.js as a viewer and preprocessor.
- Loading and displaying sample input and output images for a specific model.
- Submitting images to Bioengine and displaying results.
- Image tiler allows to run model on large images.
- Export ImJoy API for using as a plugin in ImJoy.

## ImJoy API

This web client supports two-way integration with ImJoy, meaning you can either use it as an ImJoy plugin or load other ImJoy plugins into it.

The following ImJoy API is supported:

| API           | Description                                           | Parameters              |
| ------------- | ----------------------------------------------------- | ----------------------- |
| runModel      | Run model on current image(in the viewer)             |                         |
| setParameters | Set model parameters                                  | `parameters: object`    |
| listModels    | List all models, return an array of model rdf objects |                         |
| setModel      | Set the current model                                 | `model: object, string` |

Usage example:

```javascript
const client = api.getWindow("bioengine-web-client");
console.log(await p.listModels());
// load cellpose model and run it
await p.setModel("Cellpose");
await p.setParameters({ diameter: 30, model_type: "cyto" });
await p.runModel();
```

## Development

```bash
$ npm install -g pnpm  # install pnpm globally
$ pnpm install         # install dependencies
$ pnpm run dev         # serve with hot reload
```
