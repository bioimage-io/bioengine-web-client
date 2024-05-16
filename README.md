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
- Integrated with [Bioimage.IO chatbot](https://github.com/bioimage-io/bioimageio-chatbot/)

## ImJoy API

This web client supports two-way integration with ImJoy, meaning you can either use it as an ImJoy plugin or load other ImJoy plugins into it.

The following ImJoy API is supported:

| API           | Description                                                                | Parameters                                |
| ------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| runModel      | Run model on current image(in the viewer)                                  |                                           |
| setParameters | Set model parameters                                                       | `parameters: object`                      |
| listModels    | List all models, return an array of model rdf objects                      |                                           |
| setModel      | Set the current model, support input a model_id or model name or nick name | `model: object, string`                   |
| setTiling     | Set the tile and overlap size for large images                             | `tileSizes: object; tileOverlaps: object` |
| waitForReady  | Wait for the model to be ready                                             |                                           |
| setServersetting  | Set the server url, and service id,                                    | `serverUrl: string; serviceId: string`    |

Usage example:

```javascript
const client = await api.getWindow("bioengine-web-client");
await client.waitForReady();
console.log(await client.listModels());
// load cellpose model and run it
await client.setModel("Cellpose");
await client.setParameters({ diameter: 30, model_type: "cyto" });
await client.setTiling({ x: 64, y: 64 });
await client.runModel();
```

## url parameters

- `model`: model name or model id
- `server_url`: the bioengine server url
- `triton_service_id`: the triton service id

Example: [Click here](https://bioimage-io.github.io/bioengine-web-client/?model=discreet-rooster&server_url=https://hypha.bioimage.io&triton_service_id=triton-client)


## As an Bioimage.IO chatbot extension

This web client can be used as an extension of the [Bioimage.IO chatbot](https://github.com/bioimage-io/bioimageio-chatbot/)
to run models on Bioengine.
You can load this url in the chatbot to use it as an extension:

```
https://bioimage-io.github.io/bioengine-web-client/chatbot-extension.imjoy.html
```

## Development

```bash
$ npm install -g pnpm  # install pnpm globally
$ pnpm install         # install dependencies
$ pnpm run dev         # serve with hot reload
```
