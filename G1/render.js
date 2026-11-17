import { mat4 } from "https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.js";

import {
  makeShaderDataDefinitions,
  makeStructuredView,
} from "https://greggman.github.io/webgpu-utils/dist/2.x/webgpu-utils.module.js";

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
  const vertexShaderCode = await (
    await fetch("./shaders/vertex.wgsl?v=" + Date.now())
  ).text();
  const fragmentShaderCode = await (
    await fetch("./shaders/fragment.wgsl?v=" + Date.now())
  ).text();
  const vertexShader = device.createShaderModule({
    code: vertexShaderCode,
  });
  const fragmentShader = device.createShaderModule({
    code: fragmentShaderCode,
  });
  // Create pipeline
  const pipeline = device.createRenderPipeline({
    label: "Basic 3d Pipeline",
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
          arrayStride: 3 * 4,
          attributes: [
            { shaderLocation: 1, offset: 0, format: "float32x3" }, // normal
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
    label: "vertexBuffer",
    size: geometryData["vertices"].byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(vertexBuffer, 0, geometryData["vertices"]);
  // Create a buffer for the normal data
  const normalBuffer = device.createBuffer({
    label: "normalBuffer",
    size: geometryData["normals"].byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(normalBuffer, 0, geometryData["normals"]);
  // Create a buffer for the index data
  const indexBuffer = device.createBuffer({
    label: "indexBuffer",
    size: geometryData["indices"].byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(indexBuffer, 0, geometryData["indices"]);
  // Create a buffer for the camera
  const cameraBuffer = device.createBuffer({
    label: "cameraBuffer",
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  // Create shader data definitions and structured view for object data
  const shaderDataDefinitions = makeShaderDataDefinitions(vertexShaderCode);
  const objectUnitSize =
    shaderDataDefinitions.storages.objects.typeDefinition.elementType.size;
  // Establish object count
  let geometryCount = 0;
  for (const shape in levelData["geometry"]) {
    geometryCount += levelData["geometry"][shape]["instances"].length;
  }
  // Make structured view for object data
  const objectsView = makeStructuredView(
    shaderDataDefinitions.storages.objects,
    new ArrayBuffer(geometryCount * objectUnitSize),
  );
  // Create a buffer for the object data
  const objectsBuffer = device.createBuffer({
    label: "objectsBuffer",
    size: objectsView.arrayBuffer.byteLength,
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
      { binding: 1, resource: { buffer: objectsBuffer } },
    ],
  });
  // Form initialization object
  const init = {
    device,
    context,
    pipeline,
    canvas,
    levelData,
    vertexBuffer,
    normalBuffer,
    indexBuffer,
    cameraBuffer,
    objectsView,
    objectsBuffer,
    renderPassDescriptor,
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
export function startRender(init, currentTime, ALPHA) {
  currentTime = currentTime / 1000;
  const {
    device,
    context,
    pipeline,
    canvas,
    levelData,
    vertexBuffer,
    normalBuffer,
    indexBuffer,
    cameraBuffer,
    objectsView,
    objectsBuffer,
    renderPassDescriptor,
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
  pass.setVertexBuffer(1, normalBuffer);
  pass.setIndexBuffer(indexBuffer, "uint32");
  // Calculate projection matrix
  const fov = (60 * Math.PI) / 180;
  const aspectRatio = canvas.width / canvas.height;
  const zNear = 0.1;
  const zFar = 1000;
  const perspective = mat4.perspective(fov, aspectRatio, zNear, zFar);
  // Calculate view matrix
  const playerLocation =
    levelData["geometry"]["player"]["instances"][0]["translation"];
  const eye = [playerLocation[0], playerLocation[1] + 5, playerLocation[2] - 5];
  const target = playerLocation;
  const up = [0, 1, 0];
  const view = mat4.lookAt(eye, target, up);
  // Pass camera to buffer
  device.queue.writeBuffer(cameraBuffer, 0, mat4.multiply(perspective, view));
  // Set light direction for the scene
  const lightDirection = [0.3, -1, 0.5];
  // Calculate model matrix for each instance
  let firstInstance = 0;
  let offset = 0;
  for (const shape in levelData["geometry"]) {
    // Calculate model matrix and color for each instance
    levelData["geometry"][shape]["instances"].forEach((instance, i) => {
      const model = mat4.create();
      mat4.identity(model);
      mat4.translate(
        model,
        [
          instance["translation"][0],
          instance["translation"][1],
          instance["translation"][2],
        ],
        model,
      );
      mat4.rotateX(model, (instance["rotation"][0] * Math.PI) / 180, model);
      mat4.rotateY(model, (instance["rotation"][1] * Math.PI) / 180, model);
      mat4.rotateZ(model, (instance["rotation"][2] * Math.PI) / 180, model);
      mat4.scale(
        model,
        [instance["scale"][0], instance["scale"][1], instance["scale"][2]],
        model,
      );
      objectsView.views[i + offset].model.set(model);
      // Set world matrix for the instance
      const world = mat4.transpose(mat4.inverse(model));
      objectsView.views[i + offset].world.set(world);
      // Set color for the instance
      objectsView.views[i + offset].color.set(instance["color"]);
      // Set light direction for the instance
      objectsView.views[i + offset].lightDirection.set(lightDirection);
    });
    // Draw calls
    const instanceCount = levelData["geometry"][shape]["instances"].length;
    if (instanceCount > 0) {
      pass.drawIndexed(
        levelData["geometry"][shape]["shape"]["indexCount"],
        instanceCount,
        levelData["geometry"][shape]["shape"]["firstIndex"],
        levelData["geometry"][shape]["shape"]["baseVertex"],
        offset,
      );
    }
    offset += instanceCount;
  }

  device.queue.writeBuffer(objectsBuffer, 0, objectsView.arrayBuffer);

  // End the render pass
  pass.end();
  // Submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}
