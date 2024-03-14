import { hyphaWebsocketClient } from "imjoy-rpc";
import {
  tfjsToImJoy,
  imjoyToTfjs,
  ImgPadder,
  ImgTiler,
  ImgTile,
  TileMerger,
  MeanTileMerger,
  getNpyEndianness,
} from "./imgProcess";
import { loadCellposeRdf } from "./utils";

class TritonExecutor {
  constructor(serverUrl, serviceId) {
    this.serverUrl = serverUrl;
    this.serviceId = serviceId;
  }

  async init() {
    const server = await hyphaWebsocketClient.connectToServer({
      server_url: this.serverUrl,
      method_timeout: 30,
      name: "client",
    });
    this.triton = await server.get_service(this.serviceId);
  }

  async loadModelConfig(nickname) {
    const url = `${this.serverUrl}/triton/v2/models/${nickname}/config`;
    const config = await fetch(url).then((res) => res.json());
    return config;
  }

  async loadModelRdf(modelId) {
    let ret;
    ret = await this.execute(modelId, undefined, true);
    const rdf = ret.result.rdf;
    return rdf;
  }

  async execute(
    modelId,
    inputs = null,
    return_rdf = false,
    weight_format = null
  ) {
    const ret = await this.triton.execute({
      _rkwargs: true,
      inputs: [
        {
          model_id: modelId,
          inputs: inputs,
          return_rdf: return_rdf,
          weight_format: weight_format,
        },
      ],
      model_name: "bioengine-model-runner",
      serialization: "imjoy",
    });
    return ret;
  }

  async runCellpose(array, additionalParameters = {}) {
    console.log("Running cellpose with parameters: ", additionalParameters);
    const ret = await this.triton.execute({
      inputs: [array, additionalParameters],
      model_name: "cellpose-python",
      decode_json: true,
      _rkwargs: true,
    });
    return ret;
  }

  async executeRawModel(array, modelId, additionalParameters = {}) {
    console.log("Running cellpose with parameters: ", additionalParameters);
    const ret = await this.triton.execute({
      inputs: [array],
      model_name: modelId,
      _rkwargs: true,
    });
    return ret;
  }

}

export class ModelRunner {
  constructor(serverUrl = "https://ai.imjoy.io", serviceId = "triton-client") {
    this.tritonExecutor = new TritonExecutor(serverUrl, serviceId);
    this.rdf = null;
    this.modelTritonConfig = null;
    this.inputEndianness = null;
    this.modelId = null;
  }

  async init() {
    await this.tritonExecutor.init();
  }

  fixedTileSize() {
    if (this.rdf && this.modelTritonConfig) {
      const inputSpec = this.rdf.inputs[0];
      const dims = this.modelTritonConfig.input[0]["dims"];
      if (dims !== undefined && !dims.includes(-1)) {
        return dims;
      }
      if (inputSpec.shape instanceof Array) {
        return inputSpec.shape;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  getInputMinShape() {
    const axes = this.rdf.inputs[0].axes; // something like "zyx"
    let minShape; // something like [16, 64, 64]
    const fixedTileSize = this.fixedTileSize();
    if (fixedTileSize === false) {
      minShape = this.rdf.inputs[0].shape.min;
    } else {
      minShape = fixedTileSize;
    }
    // return something like {x: 64, y: 64, z: 16}
    const res = axes.split("").reduce((acc, cur, i) => {
      acc[cur] = minShape[i];
      return acc;
    }, {});
    return res;
  }

  getInputMaxShape() {
    const axes = this.rdf.inputs[0].axes; // something like "zyx"
    let maxShape; // something like [16, 64, 64]
    const fixedTileSize = this.fixedTileSize();
    if (fixedTileSize !== false) {
      maxShape = fixedTileSize;
    } else {
      // array of undefined
      maxShape = this.rdf.inputs[0].shape.min.map(() => undefined);
    }
    return axes.split("").reduce((acc, cur, i) => {
      acc[cur] = maxShape[i];
      return acc;
    }, {});
  }

  getDefaultTileSizes() {
    const inputMinShape = this.getInputMinShape();
    const tileSizes = Object.assign({}, inputMinShape);
    const axes = this.rdf.inputs[0].axes;
    const fixedTileSize = this.fixedTileSize();
    if (fixedTileSize === false) {
      const xyFactor = 4;
      tileSizes.x = xyFactor * inputMinShape.x;
      tileSizes.y = xyFactor * inputMinShape.y;
    } else {
      axes.split("").map((a, i) => {
        tileSizes[a] = fixedTileSize[i];
      });
    }
    return tileSizes;
  }

  getDefaultTileOverlaps() {
    const inputSpec = this.rdf.inputs[0];
    const outputSpec = this.rdf.outputs[0];
    const axes = inputSpec.axes;
    let overlaps = {};
    if (outputSpec.halo && this.fixedTileSize() === false) {
      axes.split("").map((a, i) => {
        if (outputSpec.axes.includes(a) && a !== "z") {
          overlaps[a] = 2 * outputSpec.halo[i];
        } else {
          overlaps[a] = 0;
        }
      });
    } else {
      overlaps = axes.split("").reduce((acc, cur) => {
        acc[cur] = 0;
        return acc;
      }, {});
    }
    return overlaps;
  }

  isImg2Img() {
    const outputSpec = this.rdf.outputs[0];
    return outputSpec.axes.includes("x") && outputSpec.axes.includes("y");
  }

  async detectInputEndianness() {
    const url = this.rdf.test_inputs[0];
    if (url) {
      this.inputEndianness = await getNpyEndianness(url);
    }
    console.log("Input endianness: " + this.inputEndianness);
  }

  async loadModel(modelId) {
    this.modelId = modelId;
    if (modelId === "cellpose-python") {
      this.rdf = loadCellposeRdf();
      this.modelTritonConfig = await this.tritonExecutor.loadModelConfig(
        modelId
      );
    } else {
      this.rdf = await this.tritonExecutor.loadModelRdf(modelId);
      const nickname = this.rdf.config.bioimageio.nickname;
      this.modelTritonConfig = await this.tritonExecutor.loadModelConfig(
        nickname
      );
      this.detectInputEndianness();
    }
  }

  async submitTensor(tensor, additionalParameters = undefined) {
    const reverseEnd = this.inputEndianness === "<";
    const data_type = this.rdf.inputs[0].data_type;
    //const reshapedImg = tfjsToImJoy(tensor, reverseEnd, data_type);
    const reshapedImg = tfjsToImJoy(tensor, reverseEnd, "float32");
    const modelId = this.modelId;
    let outImg;
    if (modelId === "cellpose-python") {
      const resp = await this.tritonExecutor.runCellpose(
        reshapedImg,
        additionalParameters
      );
      outImg = resp.mask;
    } else {
      //const resp = await this.tritonExecutor.execute(modelId, [reshapedImg]);
      //const resp = await this.tritonExecutor.executeRawModel(reshapedImg, modelId, {});
      const resp = await this.tritonExecutor.executeRawModel(reshapedImg, "affable-shark", {});
      //if (!resp.result.success) {
      //  throw new Error(resp.result.error);
      //}
      //outImg = resp.result.outputs[0];
      outImg = resp[506]
    }
    return outImg;
  }

  async runOneTensor(tensor, padder, additionalParameters = undefined) {
    console.log("Input tile shape: " + tensor.shape);
    const [paddedTensor, padArr] = padder.pad(tensor);
    console.log("Padded tile shape: " + paddedTensor.shape);
    let outImg = await this.submitTensor(paddedTensor, additionalParameters);
    console.log("Output tile shape: " + outImg._rshape);
    const outTensor = imjoyToTfjs(outImg);
    const isImg2Img =
      this.rdf.outputs[0].axes.includes("x") &&
      this.rdf.outputs[0].axes.includes("y");
    let result = outTensor;
    if (isImg2Img) {
      const cropedTensor = padder.crop(outTensor, padArr);
      result = cropedTensor;
    }
    return result;
  }

  async runTiles(
    tensor,
    inputSpec,
    outputSpec,
    tileSizes,
    tileOverlaps,
    additionalParameters = undefined,
    reportFunc = undefined
  ) {
    if (!reportFunc) {
      reportFunc = (msg) => {
        console.log(msg);
      };
    }
    let padder;
    const fixedTileSize = this.fixedTileSize();
    if (fixedTileSize === false) {
      padder = new ImgPadder(
        undefined,
        inputSpec.shape.min,
        inputSpec.shape.step,
        0
      );
    } else {
      padder = new ImgPadder(fixedTileSize, undefined, undefined, 0);
    }
    const tileSize = inputSpec.axes.split("").map((a) => tileSizes[a]);
    const overlap = inputSpec.axes.split("").map((a) => tileOverlaps[a]);
    console.log("tile size:", tileSize, "overlap:", overlap);
    const tiler = new ImgTiler(tensor.shape, tileSize, overlap);
    const nTiles = tiler.getNTiles();
    console.log("Number of tiles in each dimension: " + nTiles);
    const inTiles = tiler.getTiles();
    console.log("Number of tiles: " + inTiles.length);
    const outTiles = [];
    for (let i = 0; i < inTiles.length; i++) {
      reportFunc(`Running the model... (${i + 1}/${inTiles.length})`);
      const tile = inTiles[i];
      console.log(tile);
      tile.slice(tensor);
      const outTensor = await this.runOneTensor(
        tile.data,
        padder,
        additionalParameters
      );
      const outTile = new ImgTile(tile.starts, tile.ends, tile.indexes);
      outTile.data = outTensor;
      outTiles.push(outTile);
    }
    const isImg2Img =
      outputSpec.axes.includes("x") && outputSpec.axes.includes("y");
    let merger;
    if (isImg2Img) {
      merger = new TileMerger(tensor.shape);
    } else {
      merger = new MeanTileMerger(tensor.shape);
    }
    const res = merger.mergeTiles(outTiles).data;
    console.log("Output image shape after merging: " + res.shape);
    return res;
  }
}
