<template>
    <div id="test-run-body">
        <div id="test-run-panel">
            <div class="model-selection">
                <div class="model-selection-line">
                    <div class="model-selection-label">Model</div>
                    <ModelSelect :open="this.modelSelectEnable" />
                </div>
                <div class="model-selection-tips" v-if="!isPluginMode">ℹ️ Please visit <a href="https://bioimage.io/#/"
                        target="_blank">bioimage.io</a> to view detailed information about the model.</div>
            </div>
            <div id="buttons">
                <Button :disabled="!this.buttonEnabledInput" @click="this.loadTestInput">
                    Load sample image
                </Button>
                <Button class="is-primary" :disabled="!this.buttonEnabledRun" @click="this.runModel">
                    Run model
                </Button>
                <Button :disabled="!this.buttonEnabledOutput" @click="this.loadTestOutput">
                    Show reference output
                </Button>
            </div>
            <ModelParameters :overlay="waiting" />
            <HideContainer :summary="'Advanced settings'">
                <OverlayContainer :open="waiting">
                    <AdvanceSetting />
                </OverlayContainer>
            </HideContainer>
            <div id="info">
                <LoadingAnimation v-if="this.waiting" />
                <div v-else-if="$props.ij === null">
                    <span>💡Tip: Drag and drop your own image file below to try out the
                        model. We support formats like .tiff, .png, and .jpg</span>
                </div>
                <div id="info-panel" :style="{ color: infoColor }">{{ this.info }}</div>
            </div>
        </div>
        <div id="ij-container" v-if="newIjWindow"></div>
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
import { watch, ref } from "vue";
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
import { useStore } from "../stores/global";
import { useRunStore } from "../stores/run";
import { useServerStore } from "../stores/server";
import { useParametersStore } from "../stores/parameters";


function rdfHas(rdf, key) {
    return rdf[key] !== undefined && rdf[key].length > 0;
}

export default {
    setup: () => {
        const store = useStore();
        const runStore = useRunStore();
        const serverStore = useServerStore();

        const newIjWindow = ref(true)
        const waiting = ref(false);
        const error = ref(false);
        const info = ref("");
        const buttonEnabledRun = ref(false);
        const buttonEnabledInput = ref(false);
        const buttonEnabledOutput = ref(false);
        const modelSelectEnable = ref(false);

        const setInfoPanel = (i, w = false, e = false) => {
            info.value = i;
            waiting.value = w;
            error.value = e;
        }

        const turnButtons = (on) => {
            if (!store?.runner?.rdf) {
                buttonEnabledRun.value = false;
                buttonEnabledInput.value = false;
                buttonEnabledOutput.value = false;
                modelSelectEnable.value = false;
            } else {
                buttonEnabledRun.value = on;
                buttonEnabledInput.value = on && (
                    rdfHas(store.runner.rdf, "test_inputs") ||
                    rdfHas(store.runner.rdf, "sample_inputs"));
                buttonEnabledOutput.value = on && (
                    rdfHas(store.runner.rdf, "test_outputs") ||
                    rdfHas(store.runner.rdf, "sample_outputs"));
                modelSelectEnable.value = on;
            }
        }

        const initModel = async (modelId, runner = undefined) => {
            const store = useStore();
            const parametersStore = useParametersStore();
            const runStore = useRunStore();
            if (runner === undefined) {
                runner = store.runner;
            }
            setInfoPanel(`Initializing model ${modelId}...`, true);
            turnButtons(false);
            try {
                await runner.loadModel(modelId);
            } catch (e) {
                setInfoPanel(`Failed to load model ${modelId}.`, false, true);
                console.error(e);
                throw e;
            }
            parametersStore.$patch({
                tileSizes: runner.getDefaultTileSizes(),
                tileOverlaps: runner.getDefaultTileOverlaps(),
                additionalParametersSchema: runner?.rdf?.additional_parameters || [],
            })
            // init additional parameters
            const initValues = {};
            for (const paramGroup of parametersStore.additionalParametersSchema) {
                for (const param of paramGroup.parameters) {
                    initValues[param.name] = param.default;
                }
            }
            console.log("Init additional parameters", initValues);
            parametersStore.$patch({
                additionalParameters: initValues,
            });
            turnButtons(true);
            setInfoPanel("");
            runStore.$patch({
                modelInitialized: true,
            })
        }

        const runModel = async () => {
            const store = useStore();
            const parametersStore = useParametersStore();
            const runner = store.runner;
            setInfoPanel("Running the model...", true);
            buttonEnabledRun.value = false;
            console.log("Spec input axes: " + store.inputSpec.axes);
            console.log("Spec output axes: " + store.outputSpec.axes);
            try {
                const img = await store.viewerControl.getImage();
                let imgAxes = inferImgAxesViaSpec(img._rshape, store.inputSpec.axes, true);
                console.log("Input image axes: " + imgAxes);
                console.log("Reshape image to match the input spec.");
                const tensor = imjoyToTfjs(img);
                const reshapedTensor = mapAxes(tensor, imgAxes, store.inputSpec.axes);
                const outTensor = await runner.runTiles(
                    reshapedTensor,
                    store.inputSpec,
                    store.outputSpec,
                    parametersStore.tileSizes,
                    parametersStore.tileOverlaps,
                    parametersStore.additionalParameters,
                    (msg) => {
                        setInfoPanel(msg, true);
                    },
                );
                if (runner.isImg2Img()) {
                    const imgsForShow = processForShow(outTensor, store.outputSpec.axes);
                    await store.viewerControl.showImgs(imgsForShow, "output");
                }
                else {
                    // classification model
                    await store.viewerControl.showTableFromTensor(outTensor, "output");
                }
            }
            catch (e) {
                alert("Failed to run the model, see console for details.");
                setInfoPanel("Failed to run the model, see console for details.", false, true);
                buttonEnabledRun.value = true;
                console.error(e);
                debugger;
                return;
            }
            setInfoPanel("");
            buttonEnabledRun.value = true;
        }

        watch(
            () => store.currentModel,
            (model) => {
                if (store?.runner?.rdf) {
                    initModel(model.id);
                }
            }
        )

        watch(
            () => (serverStore.serverUrl, serverStore.serviceId, serverStore.updateCount),
            async () => {
                const store = useStore();
                const serverStore = useServerStore();
                const runStore = useRunStore();
                const oldModelId = store.runner.modelId;
                setInfoPanel("Initializing server...", true);
                turnButtons(false);
                try {
                    const runner = new ModelRunner(serverStore.serverUrl, serverStore.serviceId);
                    await runner.init();
                    await initModel(oldModelId, runner);
                    store.$patch({
                        runner: runner,
                    });
                    turnButtons(true);
                    setInfoPanel("");
                } catch (e) {
                    setInfoPanel("Failed to initialize the server.", false, true);
                    turnButtons(false);
                    console.error(e);
                } finally {
                    runStore.$patch({
                        serverInitialized: true,
                    });
                }
            }
        )

        watch(
            () => waiting.value,
            () => {
                runStore.$patch({
                    runable: !waiting.value,
                });
            }
        )

        watch(
            () => runStore.queryCount,
            async (count) => {
                await runModel();
            }
        )

        const isPluginMode = window.self !== window.top;

        return {
            waiting,
            error,
            info,
            buttonEnabledRun,
            buttonEnabledInput,
            buttonEnabledOutput,
            modelSelectEnable,
            setInfoPanel,
            turnButtons,
            initModel,
            runModel,
            newIjWindow,
            isPluginMode,
        }
    },
    data: () => ({
        ij: null,
        api: null,  // ImJoy API
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
    },
    mounted() {
        this.init();
    },
    methods: {
        async init() {
            const store = useStore();
            this.setInfoPanel("Initializing...", true);
            await this.initImJoy();
            const runner = new ModelRunner(store.serverUrl, store.serviceId);
            await runner.init();
            store.$patch({
                runner: runner,
            });
            const defaultModelId = "10.5281/zenodo.5764892";
            await this.initModel(defaultModelId);
            this.turnButtons(false)
            this.setInfoPanel("Initializing ImageJ.JS ...", true);
            await this.initImageJ();
            store.$patch({
                viewerControl: new ImagejJsController(this.ij),
            });
            this.setInfoPanel("");
            this.turnButtons(true);
            if (window.app.client) {
                const clientApi = window.app.client;
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has("model")) {
                    const model = urlParams.get("model");
                    await clientApi.setModel(model);
                }
                if (urlParams.has("server_url") && urlParams.has("triton_service_id")) {
                    const serverUrl = urlParams.get("server_url");
                    const serviceId = urlParams.get("triton_service_id");
                    await clientApi.setServerSetting(serverUrl, serviceId);
                }
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
            const api = imjoy;
            this.api = api;
        },
        async initImageJ() {
            const ij = await this.api.getWindow("ImageJ.JS");
            if (ij) {
                this.newIjWindow = false;
                this.ij = ij
            } else {
                const pluginMode = window.self !== window.top
                if (pluginMode) {
                    this.newIjWindow = false;
                }
                console.log("Create IJ window...");
                this.ij = await this.api.createWindow({
                    src: "https://ij.imjoy.io/",
                    name: "ImageJ.JS",
                    fullscreen: false,
                    window_id: "ij-container"
                });
            }
        },
        async loadTestInput() {
            const store = useStore();
            const runner = store.runner;
            this.setInfoPanel("Loading test input...", true);
            if (rdfHas(runner.rdf, "test_inputs")) {
                try {
                    await store.viewerControl.viewFromUrl(
                        runner.rdf.test_inputs[0],
                        store.inputSpec, store.outputSpec
                    );
                }
                catch (err) {
                    console.log("Failed to load the test input, see console for details.");
                    console.error(err);
                    console.log("Loading sample input instead...");
                    await store.viewerControl.viewFromUrl(
                        runner.rdf.sample_inputs[0],
                        store.inputSpec, store.outputSpec
                    );
                }
            }
            else if (rdfHas(runner.rdf, "sample_inputs")) {
                await store.viewerControl.viewFromUrl(
                    runner.rdf.sample_inputs[0],
                    store.inputSpec, store.outputSpec
                );
            }
            else {
                alert("No test input found.");
            }
            this.setInfoPanel("");
        },
        async loadTestOutput() {
            const store = useStore();
            const runner = store.runner;
            this.setInfoPanel("Loading test output...", true);
            if (rdfHas(runner.rdf, "test_outputs")) {
                try {
                    await store.viewerControl.viewFromUrl(
                        runner.rdf.test_outputs[0],
                        store.inputSpec, store.outputSpec,
                        "output",
                    );
                }
                catch (err) {
                    console.log("Failed to load the test output.");
                    console.error(err);
                    console.log("Loading sample output instead...");
                    await store.viewerControl.viewFromUrl(
                        runner.rdf.sample_outputs[0],
                        store.inputSpec, store.outputSpec,
                        "output");
                }
            }
            else if (rdfHas(runner.rdf, "sample_outputs")) {
                await store.viewerControl.viewFromUrl(
                    runner.rdf.sample_outputs[0],
                    store.inputSpec, store.outputSpec,
                    "output");
            }
            else {
                alert("No test output found.");
            }
            this.setInfoPanel("");
        }
    },
    components: { HideContainer, OverlayContainer, AdvanceSetting, LoadingAnimation, ModelSelect, ModelParameters }
};
</script>
