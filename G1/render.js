export async function initRender(geometryData, levelData) {
  // Initialize WebGPU
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    fail("need a browser that supports WebGPU");
    return;
  }
  const canvas = document.querySelector("canvas");
  const context = canvas.getContext("webgpu");
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });
  // Load shaders
  const vertexShader = device.createShaderModule({
    code: await (await fetch("./shaders/vertex.wgsl?v=' + Date.now()")).text(),
  });
  const fragmentShader = device.createShaderModule({
    code: await (
      await fetch("./shaders/fragment.wgsl?v=' + Date.now()")
    ).text(),
  });
  // Create pipeline
  const pipeline = device.createRenderPipeline({
    label: "Red Shapes",
    layout: "auto",
    vertex: {
      entryPoint: "vertexShader",
      module: vertexShader,
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // xyz
          ],
        },
        {
          arrayStride: 4 + 3 * 4,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 1, offset: 0, format: "unorm8x4" }, // color
            { shaderLocation: 2, offset: 4, format: "float32x3" }, // offset
          ],
        },
        {
          arrayStride: 3 * 4,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 3, offset: 0, format: "float32x3" }, // scale
          ],
        },
      ],
    },
    fragment: {
      entryPoint: "fragmentShader",
      module: fragmentShader,
      targets: [{ format: presentationFormat }],
    },
  });
  // Create a buffer for the vertex data
  const vertexBuffer = device.createBuffer({
    size: geometryData["vertices"].byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, geometryData["vertices"]);
  // Create a buffer for the static index data
  const indexBuffer = device.createBuffer({
    size: geometryData["indices"].byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, geometryData["indices"]);
  // Establish object count
  let geometryCount = 0;
  for (const shape in levelData["geometry"]) {
    geometryCount += levelData["geometry"][shape]["instances"].length;
  }
  // Create a buffer for static attributes
  const staticUnitSize =
    4 + // color
    3 * 4; // offset
  const staticVertexBufferSize = staticUnitSize * geometryCount;
  const staticVertexBuffer = device.createBuffer({
    label: "static vertex for objects",
    size: staticVertexBufferSize,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  // Populate static buffer with values
  const staticVertexValuesU8 = new Uint8Array(staticVertexBufferSize);
  const staticVertexValuesF32 = new Float32Array(staticVertexValuesU8.buffer);
  let rollingOffset = 0;
  for (const shape in levelData["geometry"]) {
    // Set colors
    levelData["geometry"][shape]["instances"].forEach((instance, i) => {
      const staticOffsetU8 = i * staticUnitSize + rollingOffset;
      const staticOffsetF32 = staticOffsetU8 / 4;
      staticVertexValuesU8.set(
        [
          instance["color"][0] * 255,
          instance["color"][1] * 255,
          instance["color"][2] * 255,
          instance["color"][3] * 255,
        ],
        staticOffsetU8,
      );
      staticVertexValuesF32.set(
        [instance["offset"][0], instance["offset"][1], instance["offset"][2]],
        staticOffsetF32 + 1,
      );
    });
    rollingOffset +=
      levelData["geometry"][shape]["instances"].length * staticUnitSize;
  }
  device.queue.writeBuffer(staticVertexBuffer, 0, staticVertexValuesF32);
  // Create a buffer for dynamic attributes
  const dynamicUnitSize = 3 * 4; // scale
  const dynamicVertexBufferSize = dynamicUnitSize * geometryCount;
  const dynamicVertexBuffer = device.createBuffer({
    label: "dynamic storage for objects",
    size: dynamicVertexBufferSize,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  // Create initial render pass descriptor
  const renderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [
      {
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  // Form initialization object
  const init = {
    device,
    context,
    pipeline,
    canvas,
    vertexBuffer,
    indexBuffer,
    staticVertexBuffer,
    dynamicVertexBuffer,
    dynamicVertexBufferSize,
    dynamicUnitSize,
    levelData,
    renderPassDescriptor,
  };
  // Start canvas observer
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const canvas = entry.target;
      const width = entry.contentBoxSize[0].inlineSize;
      const height = entry.contentBoxSize[0].blockSize;
      canvas.width = Math.max(
        1,
        Math.min(width, device.limits.maxTextureDimension2D),
      );
      canvas.height = Math.max(
        1,
        Math.min(height, device.limits.maxTextureDimension2D),
      );
    }
    startRender(init, 0);
  });
  observer.observe(canvas);
  // Return init object
  return init;
}

export function startRender(init, ALPHA) {
  const {
    device,
    context,
    pipeline,
    canvas,
    vertexBuffer,
    indexBuffer,
    staticVertexBuffer,
    dynamicVertexBuffer,
    dynamicVertexBufferSize,
    dynamicUnitSize,
    levelData,
    renderPassDescriptor,
  } = init;
  // Update the render pass descriptor with the current texture view
  renderPassDescriptor.colorAttachments[0].view = context
    .getCurrentTexture()
    .createView();
  // Create a command encoder and render pass
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  // Set buffers
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  pass.setVertexBuffer(1, staticVertexBuffer);
  pass.setVertexBuffer(2, dynamicVertexBuffer);
  const aspect = canvas.width / canvas.height;
  const dynamicValues = new Float32Array(dynamicVertexBufferSize / 4);
  let rollingOffset = 0;
  let firstInstance = 0;
  for (const shape in levelData["geometry"]) {
    // Set scales
    levelData["geometry"][shape]["instances"].forEach((instance, i) => {
      const offset = (i * dynamicUnitSize) / 4 + rollingOffset;
      const newScale = [
        instance["scale"][0] / aspect,
        instance["scale"][1],
        instance["scale"][2],
      ];
      dynamicValues.set(newScale, offset);
    });
    rollingOffset +=
      (levelData["geometry"][shape]["instances"].length * dynamicUnitSize) / 4;
    // Draw calls
    const instanceCount = levelData["geometry"][shape]["instances"].length;
    console.log(`Drawing ${instanceCount} instances of shape: ${shape}`);
    if (instanceCount > 0) {
      pass.drawIndexed(
        levelData["geometry"][shape]["shape"]["indexCount"],
        instanceCount,
        levelData["geometry"][shape]["shape"]["firstIndex"],
        levelData["geometry"][shape]["shape"]["baseVertex"],
        firstInstance,
      );
    }
    firstInstance += instanceCount;
  }
  device.queue.writeBuffer(dynamicVertexBuffer, 0, dynamicValues);
  // End the render pass
  pass.end();
  // Submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}
