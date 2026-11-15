import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js";

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
      ],
    },
    fragment: {
      entryPoint: "fragmentShader",
      module: fragmentShader,
      targets: [{ format: presentationFormat }],
    },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
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
  // Create a buffer for matrices and colors
  const objectUnitSize = 4 * 4 + 4; // 4x4 matrix + vec4 color
  const objectBufferSize = geometryCount * objectUnitSize;
  const objectData = new Float32Array(objectBufferSize);
  const cameraBuffer = device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const objectBuffer = device.createBuffer({
    size: objectData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
    depthStencilAttachment: {
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  };
  // Set bind group for camera and object data
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: cameraBuffer } },
      { binding: 1, resource: { buffer: objectBuffer } },
    ],
  });
  // Form initialization object
  const init = {
    device,
    context,
    pipeline,
    canvas,
    vertexBuffer,
    indexBuffer,
    levelData,
    renderPassDescriptor,
    cameraBuffer,
    objectBuffer,
    objectUnitSize,
    objectBufferSize,
    bindGroup,
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

let depthTexture;
export function startRender(init, ALPHA) {
  const {
    device,
    context,
    pipeline,
    canvas,
    vertexBuffer,
    indexBuffer,
    levelData,
    renderPassDescriptor,
    cameraBuffer,
    objectBuffer,
    objectUnitSize,
    objectBufferSize,
    bindGroup,
  } = init;
  // Set depth texture
  if (
    !depthTexture ||
    depthTexture.width !== canvas.width ||
    depthTexture.height !== canvas.height
  ) {
    depthTexture?.destroy();
    depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }
  // Update the render pass descriptor with the current texture view
  renderPassDescriptor.colorAttachments[0].view = context
    .getCurrentTexture()
    .createView();
  // Update the depth texture view in the render pass descriptor
  renderPassDescriptor.depthStencilAttachment.view = depthTexture.createView();
  // Create a command encoder and render pass
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  // Set buffers
  pass.setVertexBuffer(0, vertexBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  // Calculate projection matrix
  const fov = (60 * Math.PI) / 180;
  const aspectRatio = canvas.width / canvas.height;
  const zNear = 0.1;
  const zFar = 1000;
  const perspective = mat4.perspective(fov, aspectRatio, zNear, zFar);
  // Calculate view matrix
  const eye = [10, 10, 10];
  const target = [0, 0, 0];
  const up = [0, 1, 0];
  const view = mat4.lookAt(eye, target, up);
  // Pass camera to buffer
  device.queue.writeBuffer(cameraBuffer, 0, mat4.multiply(perspective, view));
  // Calculate model matrix for each instance
  const objectValues = new Float32Array(objectBufferSize);
  let rollingOffset = 0;
  let firstInstance = 0;
  for (const shape in levelData["geometry"]) {
    // Calculate model matrix and color for each instance
    levelData["geometry"][shape]["instances"].forEach((instance, i) => {
      const offset = i * objectUnitSize + rollingOffset;
      const matrix = mat4.create();
      mat4.identity(matrix);
      mat4.translate(
        matrix,
        [
          instance["translation"][0],
          instance["translation"][1],
          instance["translation"][2],
        ],
        matrix,
      );
      mat4.rotateX(matrix, (instance["rotation"][0] * Math.PI) / 180, matrix);
      mat4.rotateY(matrix, (instance["rotation"][1] * Math.PI) / 180, matrix);
      mat4.rotateZ(matrix, (instance["rotation"][2] * Math.PI) / 180, matrix);
      mat4.scale(
        matrix,
        [instance["scale"][0], instance["scale"][1], instance["scale"][2]],
        matrix,
      );
      objectValues.set(matrix, offset);
      // Set color for the instance
      const colorOffset = offset + 4 * 4;
      objectValues.set(instance["color"], colorOffset);
    });
    rollingOffset +=
      levelData["geometry"][shape]["instances"].length * objectUnitSize;
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
  device.queue.writeBuffer(objectBuffer, 0, objectValues);

  // End the render pass
  pass.end();
  // Submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}
