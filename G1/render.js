export async function initialize(staticVertexData, staticVertexCount) {
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
    code: await (await fetch("./shaders/vertex.wgsl")).text(),
  });
  const fragmentShader = device.createShaderModule({
    code: await (await fetch("./shaders/fragment.wgsl")).text(),
  });
  // Create pipeline
  const pipeline = device.createRenderPipeline({
    label: "Red Triangle",
    layout: "auto",
    vertex: {
      entryPoint: "vertexShader",
      module: vertexShader,
      buffers: [
        {
          arrayStride: 3 * 4, // 3 floats, 4 bytes each
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
  });
  // Create a buffer for the static vertex data
  const staticVertexBuffer = device.createBuffer({
    size: staticVertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(staticVertexBuffer, 0, staticVertexData);
  // Create initial render pass descriptor
  const renderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };
  // Return init object
  return {
    device,
    context,
    pipeline,
    staticVertexBuffer,
    staticVertexCount,
    renderPassDescriptor,
  };
}

export function render(init, ALPHA) {
  const {
    device,
    context,
    pipeline,
    staticVertexBuffer,
    staticVertexCount,
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
  pass.setVertexBuffer(0, staticVertexBuffer);
  pass.draw(staticVertexCount, 1, 0, 0);
  pass.end();
  // Submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}
