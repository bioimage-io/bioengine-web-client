<template>
  <div id="test-run-body">
    <div id="buttons">
      <Button
        :disabled="!this.buttonEnabledInput"
        @click="this.loadTestInput"
      >
        Load sample image
      </Button>
      <Button
        class="is-primary"
        :disabled="!this.buttonEnabledRun"
        @click="this.runModel"
      >
        Run model
      </Button>
      <Button
        :disabled="!this.buttonEnabledOutput"
        @click="this.loadTestOutput"
      >
        Show reference output
      </Button>
    </div>
    <HideContainer :summary="'Advanced settings'">
      <OverlayContainer :open="waiting">
        <AdvanceSetting
          :tritonConfig="this.tritonConfig"
          :inputMinShape="this.inputMinShape"
          :inputMaxShape="this.inputMaxShape"
          :tileSizes="this.tileSizes"
          :tileOverlaps="this.tileOverlaps"
        ></AdvanceSetting>
      </OverlayContainer>
    </HideContainer>
    <div id="info">
      <LoadingAnimation v-if="this.waiting"/>
      <div v-else-if="$props.ij === null">
        <span
          >💡Tip: Drag and drop your own image file below to try out the
          model. We support formats like .tiff, .png, and .jpg</span
        >
      </div>
      <div id="info-panel" :style="{ color: infoColor }">{{ this.info }}</div>
    </div>
    <div id="ij-container" v-if="$props.ij === null"></div>
  </div>
</template>

<style scoped>
#ij-container {
    height: 600px;
    border: 1px solid #ccc;
}
#buttons {
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
}
#info-panel {
    display: inline-block;
    margin-left: 10px;
    margin-bottom: 20px;
}
#info {
    margin-top: 10px;
}
</style>

<script>
import {
    processForShow,
    mapAxes,
    inferImgAxesViaSpec,
    imjoyToTfjs,
} from "../imgProcess";
import HideContainer from "./HideContainer.vue";
import OverlayContainer from "./OverlayContainer.vue";
import AdvanceSetting from "./AdvanceSetting.vue";
import LoadingAnimation from "./LoadingAnimation.vue";
import { ModelRunner } from "../modelRun";
import { ImagejJsController } from "../viewerControl";

function rdfHas(rdf, key) {
  return rdf[key] !== undefined && rdf[key].length > 0;
}

export default {
    props: {
        ij: {
            type: Object,
            default: null,
        },
    },
    data: () => ({
        waiting: false,
        error: false,
        info: "",
        ij: null,
        api: null,  // ImJoy API
        buttonEnabledRun: false,
        buttonEnabledInput: false,
        buttonEnabledOutput: false,
        tileSizes: { x: 0, y: 0, z: 0 },
        tileOverlaps: { x: 0, y: 0, z: 0 },
        runner: null,
    }),
    computed: {
        infoColor() {
            if (this.error) {
                return "red";
            }
            else {
                return "black";
            }
        },
        tritonConfig() {
            if (!this.runner) {
                return {};
            }
            return this.runner.modelTritonConfig;
        },
        inputMinShape() {
            if (!this.runner) {
                return {};
            }
            return this.runner.getInputMinShape();
        },
        inputMaxShape() {
            if (!this.runner) {
                return {};
            }
            return this.runner.getInputMaxShape();
        },
    },
    watch: {
        tileSizes: {
            handler(oldObj, newObj) {
                if (newObj.y !== newObj.x) {
                    this.tileSizes.y = newObj.x; // keep x and y the same
                }
                console.log(oldObj, newObj);
            },
            deep: true
        },
        tileOverlaps: {
            handler(oldObj, newObj) {
                if (newObj.y !== newObj.x) {
                    this.tileOverlaps.y = newObj.x; // keep x and y the same
                }
                console.log(oldObj, newObj);
            },
            deep: true
        }
    },
    mounted() {
        this.init();
    },
    methods: {
        async init() {
            this.setInfoPanel("Initializing...", true);
            await this.initImJoy();
            const runner = new ModelRunner("https://ai.imjoy.io");
            await runner.init();
            this.runner = runner;
            const defaultModelId = "10.5281/zenodo.5764892";
            await this.initModel(defaultModelId);
            if (this.$props.ij) {
                this.ij = props.ij;
            } else {
                this.setInfoPanel("Initializing ImageJ.JS ...", true);
                await this.initImageJ();
            }
            this.viewerControl = new ImagejJsController(this.ij);
            this.setInfoPanel("");
        },
        async initModel(modelId) {
            this.setInfoPanel(`Initializing model ${modelId}...`, true);
            await this.runner.loadModel(modelId);
            this.tileSizes = this.runner.getDefaultTileSizes();
            this.tileOverlaps = this.runner.getDefaultTileOverlaps();
            this.buttonEnabledRun = true;
            if (rdfHas(this.runner.rdf, "test_inputs") ||
                rdfHas(this.runner.rdf, "sample_inputs")) {
                this.buttonEnabledInput = true;
            }
            if (rdfHas(this.runner.rdf, "test_outputs") ||
                rdfHas(this.runner.rdf, "sample_outputs")) {
                this.buttonEnabledOutput = true;
            }
            this.setInfoPanel("");
        },
        async initImJoy() {
            function waitForImjoy(timeout = 10000) {
                return new Promise((resolve, reject) => {
                    const interval = setInterval(() => {
                        if (window.app && window.app.imjoy !== undefined) {
                            clearInterval(interval);
                            resolve(window.app.imjoy);
                        }
                    }, 100); // Check every 100 milliseconds
                    // Optional: Reject the promise after a timeout
                    setTimeout(() => {
                        clearInterval(interval);
                        reject(new Error("Timeout waiting for window.app.imjoy"));
                    }, timeout);
                });
            }
            const imjoy = await waitForImjoy();
            console.log("ImJoy is ready:", imjoy);
            const api = window.app.imjoy.api;
            this.api = api;
        },
        async initImageJ() {
            console.log("Initializing IJ...");
            this.ij = await this.api.createWindow({
                src: "https://ij.imjoy.io/",
                name: "ImageJ.JS",
                fullscreen: false,
                window_id: "ij-container"
            });
        },
        setInfoPanel(info, waiting = false, error = false) {
            this.info = info;
            this.waiting = waiting;
            this.error = error;
        },
        async runModel() {
            this.setInfoPanel("Running the model...", true);
            this.buttonEnabledRun = false;
            const inputSpec = this.runner.rdf.inputs[0];
            const outputSpec = this.runner.rdf.outputs[0];
            console.log("Spec input axes: " + inputSpec.axes);
            console.log("Spec output axes: " + outputSpec.axes);
            try {
                const img = await this.viewerControl.getImage({ format: "ndarray", all: true });
                let imgAxes = inferImgAxesViaSpec(img._rshape, inputSpec.axes, true);
                console.log("Input image axes: " + imgAxes);
                console.log("Reshape image to match the input spec.");
                const tensor = imjoyToTfjs(img);
                const reshapedTensor = mapAxes(tensor, imgAxes, inputSpec.axes);
                const outTensor = await this.runner.runTiles(
                    reshapedTensor,
                    inputSpec,
                    outputSpec,
                    this.tileSizes,
                    this.tileOverlaps,
                    (msg) => {
                        this.setInfoPanel(msg, true);
                    }
                );
                if (this.runner.isImg2Img()) {
                    const imgsForShow = processForShow(outTensor, outputSpec.axes);
                    await this.viewerControl.showImgs(imgsForShow, "output");
                }
                else {
                    // classification model
                    await this.viewerControl.showTableFromTensor(outTensor, "output");
                }
            }
            catch (e) {
                alert("Failed to run the model, see console for details.");
                this.setInfoPanel("Failed to run the model, see console for details.", false, true);
                this.buttonEnabledRun = true;
                console.error(e);
                debugger;
                return;
            }
            this.setInfoPanel("");
            this.buttonEnabledRun = true;
        },
        async loadTestInput() {
            this.setInfoPanel("Loading test input...", true);
            if (rdfHas(this.runner.rdf, "test_inputs")) {
                try {
                    await this.viewerControl.viewFromUrl(this.runner.rdf.test_inputs[0]);
                }
                catch (err) {
                    console.log("Failed to load the test input, see console for details.");
                    console.error(err);
                    console.log("Loading sample input instead...");
                    await this.viewerControl.viewFromUrl(this.runner.rdf.sample_inputs[0]);
                }
            }
            else if (rdfHas(this.runner.rdf, "sample_inputs")) {
                await this.viewerControl.viewFromUrl(this.runner.rdf.sample_inputs[0]);
            }
            else {
                alert("No test input found.");
            }
            this.setInfoPanel("");
        },
        async loadTestOutput() {
            this.setInfoPanel("Loading test output...", true);
            if (rdfHas(this.runner.rdf, "test_outputs")) {
                try {
                    await this.viewerControl.viewFromUrl(this.runner.rdf.test_outputs[0], "output");
                }
                catch (err) {
                    console.log("Failed to load the test output.");
                    console.error(err);
                    console.log("Loading sample output instead...");
                    await this.viewerControl.viewFromUrl(this.runner.rdf.sample_outputs[0], "output");
                }
            }
            else if (rdfHas(this.runner.rdf, "sample_outputs")) {
                await this.viewerControl.viewFromUrl(this.runner.rdf.sample_outputs[0], "output");
            }
            else {
                await alert("No test output found.");
            }
            this.setInfoPanel("");
        }
    },
    components: { HideContainer, OverlayContainer, AdvanceSetting, LoadingAnimation }
};
</script>
