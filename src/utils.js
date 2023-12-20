export const loadCellposeRdf = () => {
  const cellposeRdf = {
    id: "cellpose-python",
    name: "Cellpose",
    nickname: "cellpose-python",
    nickname_icon: "🌸",
    description: "Cellpose model for segmenting nuclei and cytoplasms.",
    inputs: [
      {
        axes: "cyx",
        data_type: "float32",
        shape: {
          min: [1, 64, 64],
          step: [1, 16, 16],
        },
      },
    ],
    outputs: [
      {
        axes: "cyx",
      },
    ],
    sample_inputs: [
      "https://zenodo.org/api/records/6647674/files/sample_input_0.tif/content",
    ],
    additional_parameters: [
      {
        name: "Cellpose Parameters",
        parameters: [
          {
            name: "diameter",
            type: "number",
            default: 30,
            description: "Diameter of the nuclei in pixels.",
          },
          {
            name: "model_type",
            type: "string",
            default: "nuclei",
            description: "Type of cells to segment.",
            enum: ["nuclei", "cyto"],
          },
        ],
      },
    ],
  };
  return cellposeRdf;
};
