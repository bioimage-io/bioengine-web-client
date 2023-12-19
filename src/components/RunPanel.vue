<template>
  <div id="test-run-body">
    <div class="model-selection">
        <div class="model-selection-line">
            <div class="model-selection-label">Model</div>
            <ModelSelect :open="this.modelSelectEnable" @model-selected="handleModelChange" :additional-models="additionalModels" />
        </div>
        <div class="model-selection-tips">ℹ️  Please visit <a href="https://bioimage.io/#/" target="_blank">bioimage.io</a> to view detailed information about the model.</div>
    </div>
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
    <ModelParameters
      :parameters="this.additionalParameters"
      :parameterValues="this.additionalParameterValues"
      :overlay="waiting"
    />
    <HideContainer :summary="'Advanced settings'">
      <OverlayContainer :open="waiting">
        <AdvanceSetting
          :tritonConfig="this.tritonConfig"
          :inputMinShape="this.inputMinShape"
          :inputMaxShape="this.inputMaxShape"
          :tileSizes="this.tileSizes"
          :tileOverlaps="this.tileOverlaps"
          :serverUrl="this.serverUrl"
          @server-url-changed="this.handleServerUrlChange"
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
#test-run-body {
    padding: 10px;
}
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
.model-selection {
    margin-bottom: 10px;
}
.model-selection-line {
    display: flex;
}
.model-selection-label {
    display: inline-block;
    margin-right: 10px;
    font-size: 20px;
    font-weight: bold;
    padding-top: 5px;
    padding-bottom: 5px;
}
.model-selection-tips {
    padding: 5px;
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
import ModelSelect from "./ModelSelect.vue";
import ModelParameters from "./ModelParameters.vue";
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
        modelSelectEnable: false,
        tileSizes: { x: 0, y: 0, z: 0 },
        tileOverlaps: { x: 0, y: 0, z: 0 },
        runner: null,
        serverUrl: "https://ai.imjoy.io",
        additionalModels: [],
        additionalParameterValues: {}
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
            if (!this?.runner?.rdf) {
                return {};
            }
            return this.runner.getInputMinShape();
        },
        inputMaxShape() {
            if (!this?.runner?.rdf) {
                return {};
            }
            return this.runner.getInputMaxShape();
        },
        inputSpec() {
            if (!this?.runner?.rdf) {
                return {};
            }
            return this.runner.rdf.inputs[0];
        },
        outputSpec() {
            if (!this?.runner?.rdf) {
                return {};
            }
            return this.runner.rdf.outputs[0];
        },
        additionalParameters() {
            if (!this?.runner?.rdf) {
                return [];
            }
            const params = this?.runner?.rdf?.additional_parameters || [];
            console.log("Additional parameters: ", params);
            return params
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
        },
        additionalParameters() {
            const initValues = {};
            for (const paramGroup of this.additionalParameters) {
                for (const param of paramGroup.parameters) {
                    initValues[param.name] = param.default;
                }
            }
            console.log("Init additional parameters", initValues)
            this.additionalParameterValues = initValues;
        },
    },
    mounted() {
        this.init();
    },
    methods: {
        async init() {
            this.setInfoPanel("Initializing...", true);
            await this.initImJoy();
            const runner = new ModelRunner(this.serverUrl);
            await runner.init();
            this.runner = runner;
            const additionalModels = [await this.runner.loadCellposeRdf()];
            this.additionalModels = additionalModels;
            const defaultModelId = "10.5281/zenodo.5764892";
            await this.initModel(defaultModelId);
            this.turnButtons(false)
            if (this.$props.ij) {
                this.ij = props.ij;
            } else {
                this.setInfoPanel("Initializing ImageJ.JS ...", true);
                await this.initImageJ();
            }
            this.viewerControl = new ImagejJsController(this.ij);
            this.setInfoPanel("");
            this.turnButtons(true);
        },
        async initModel(modelId, runner=undefined) {
            if (runner === undefined) {
                runner = this.runner;
            }
            this.setInfoPanel(`Initializing model ${modelId}...`, true);
            this.turnButtons(false);
            try {
                await runner.loadModel(modelId);
            } catch (e) {
                this.setInfoPanel(`Failed to load model ${modelId}.`, false, true);
                console.error(e);
                throw e;
            }
            this.tileSizes = runner.getDefaultTileSizes();
            this.tileOverlaps = runner.getDefaultTileOverlaps();
            this.turnButtons(true);
            this.setInfoPanel("");
        },
        turnButtons(on) {
            if (!this?.runner?.rdf) {
                this.buttonEnabledRun = false;
                this.buttonEnabledInput = false;
                this.buttonEnabledOutput = false;
                this.modelSelectEnable = false;
            } else {
                this.buttonEnabledRun = on;
                this.buttonEnabledInput = on && (
                    rdfHas(this.runner.rdf, "test_inputs") ||
                    rdfHas(this.runner.rdf, "sample_inputs"));
                this.buttonEnabledOutput = on && (
                    rdfHas(this.runner.rdf, "test_outputs") ||
                    rdfHas(this.runner.rdf, "sample_outputs"));
                this.modelSelectEnable = on;
            }
        },
        handleModelChange(model) {
            if (this?.runner?.rdf) {
                this.initModel(model.id);
            }
        },
        async handleServerUrlChange(url) {
            this.serverUrl = url;
            const oldModelId = this.runner.modelId;
            this.setInfoPanel("Initializing server...", true);
            this.turnButtons(false);
            try {
                const runner = new ModelRunner(this.serverUrl);
                await runner.init();
                await this.initModel(oldModelId, runner);
                this.runner = runner;
                this.turnButtons(true);
                this.setInfoPanel("");
            } catch (e) {
                this.setInfoPanel("Failed to initialize the server.", false, true);
                this.turnButtons(false);
                console.error(e);
            }
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
            console.log("Spec input axes: " + this.inputSpec.axes);
            console.log("Spec output axes: " + this.outputSpec.axes);
            try {
                const img = await this.viewerControl.getImage();
                let imgAxes = inferImgAxesViaSpec(img._rshape, this.inputSpec.axes, true);
                console.log("Input image axes: " + imgAxes);
                console.log("Reshape image to match the input spec.");
                const tensor = imjoyToTfjs(img);
                const reshapedTensor = mapAxes(tensor, imgAxes, this.inputSpec.axes);
                const outTensor = await this.runner.runTiles(
                    reshapedTensor,
                    this.inputSpec,
                    this.outputSpec,
                    this.tileSizes,
                    this.tileOverlaps,
                    this.additionalParameterValues,
                    (msg) => {
                        this.setInfoPanel(msg, true);
                    },
                );
                if (this.runner.isImg2Img()) {
                    const imgsForShow = processForShow(outTensor, this.outputSpec.axes);
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
                    await this.viewerControl.viewFromUrl(
                        this.runner.rdf.test_inputs[0],
                        this.inputSpec, this.outputSpec
                    );
                }
                catch (err) {
                    console.log("Failed to load the test input, see console for details.");
                    console.error(err);
                    console.log("Loading sample input instead...");
                    await this.viewerControl.viewFromUrl(
                        this.runner.rdf.sample_inputs[0],
                        this.inputSpec, this.outputSpec
                    );
                }
            }
            else if (rdfHas(this.runner.rdf, "sample_inputs")) {
                await this.viewerControl.viewFromUrl(
                    this.runner.rdf.sample_inputs[0],
                    this.inputSpec, this.outputSpec
                );
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
                    await this.viewerControl.viewFromUrl(
                        this.runner.rdf.test_outputs[0],
                        this.inputSpec, this.outputSpec,
                        "output",
                    );
                }
                catch (err) {
                    console.log("Failed to load the test output.");
                    console.error(err);
                    console.log("Loading sample output instead...");
                    await this.viewerControl.viewFromUrl(
                        this.runner.rdf.sample_outputs[0],
                        this.inputSpec, this.outputSpec,
                        "output");
                }
            }
            else if (rdfHas(this.runner.rdf, "sample_outputs")) {
                await this.viewerControl.viewFromUrl(
                    this.runner.rdf.sample_outputs[0],
                    this.inputSpec, this.outputSpec,
                    "output");
            }
            else {
                await alert("No test output found.");
            }
            this.setInfoPanel("");
        }
    },
    components: { HideContainer, OverlayContainer, AdvanceSetting, LoadingAnimation, ModelSelect, ModelParameters }
};
</script>
