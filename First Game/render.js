// TODO: Delete after no longer needed
const rand = (min, max) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};
function createCircleVertices({
  radius = 1,
  numSubdivisions = 24,
  innerRadius = 0,
  startAngle = 0,
  endAngle = Math.PI * 2,
} = {}) {
  const numVertices = numSubdivisions * 3 * 2;
  const vertexData = new Float32Array(numSubdivisions * 2 * 3 * 2);

  let offset = 0;
  const addVertex = (x, y) => {
    vertexData[offset++] = x;
    vertexData[offset++] = y;
  };

  for (let i = 0; i < numSubdivisions; ++i) {
    const angle1 = startAngle + (i + 0) * (endAngle - startAngle) / numSubdivisions;
    const angle2 = startAngle + (i + 1) * (endAngle - startAngle) / numSubdivisions;

    const c1 = Math.cos(angle1);
    const s1 = Math.sin(angle1);
    const c2 = Math.cos(angle2);
    const s2 = Math.sin(angle2);

    addVertex(c1 * radius, s1 * radius);
    addVertex(c2 * radius, s2 * radius);
    addVertex(c1 * innerRadius, s1 * innerRadius);

    addVertex(c1 * innerRadius, s1 * innerRadius);
    addVertex(c2 * radius, s2 * radius);
    addVertex(c2 * innerRadius, s2 * innerRadius);
  }

  return {
    vertexData,
    numVertices,
  };
}
//

// Initialize WebGPU
const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter?.requestDevice();
if (!device) {
  fail('need a browser that supports WebGPU');
}
const canvas = document.querySelector('canvas');
const context = canvas.getContext('webgpu');
const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device,
  format: presentationFormat,
});

// Load shaders
const vertexShader = device.createShaderModule({
  code: await (await fetch('./shaders/vertex.wgsl')).text(),
});
const fragmentShader = device.createShaderModule({
  code: await (await fetch('./shaders/fragment.wgsl')).text(),
});

// Create pipeline
const pipeline = device.createRenderPipeline({
  label: 'our hardcoded rgb triangle pipeline',
  layout: 'auto',
  vertex: {
    entryPoint: 'vertexShader',
    module: vertexShader,
  },
  fragment: {
    entryPoint: 'fragmentShader',
    module: fragmentShader,
    targets: [{ format: presentationFormat }],
  },
});

// Create vertex storage buffer
const { vertexData, numVertices } = createCircleVertices({
  radius: 0.5,
  innerRadius: 0.25,
});
const vertexStorageBuffer = device.createBuffer({
  label: 'storage buffer vertices',
  size: vertexData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexStorageBuffer, 0, vertexData);

// Create attributes uniform buffer
const uniformBufferSize =
  4 * 4 +
  2 * 4 +
  2 * 4;
const uniformBuffer = device.createBuffer({
  size: uniformBufferSize,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

// Create uniform buffers and values for all circles
const uniformValues = new Float32Array(uniformBufferSize / 4);
const kColorOffset = 0;
const kScaleOffset = 4;
const kOffsetOffset = 6;
const kNumObjects = 100;
const objectInfos = [];
for (let i = 0; i < kNumObjects; ++i) {
  const uniformBuffer = device.createBuffer({
    label: `uniforms for obj: ${i}`,
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  const uniformValues = new Float32Array(uniformBufferSize / 4);
  uniformValues.set([rand(), rand(), rand(), 1], kColorOffset);
  uniformValues.set([rand(-0.9, 0.9), rand(-0.9, 0.9)], kOffsetOffset);
  const bindGroup = device.createBindGroup({
    label: `bind group for obj: ${i}`,
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: uniformBuffer },
      { binding: 1, resource: vertexStorageBuffer },
    ],
  });
  objectInfos.push({
    scale: rand(0.2, 0.5),
    uniformBuffer,
    uniformValues,
    bindGroup,
  });
}

// Create render pass descriptor
const renderPassDescriptor = {
  label: 'our basic canvas renderPass',
  colorAttachments: [
    {
      clearValue: [0.3, 0.3, 0.3, 1],
      loadOp: 'clear',
      storeOp: 'store',
    },
  ],
};

const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const canvas = entry.target;
    const width = entry.contentBoxSize[0].inlineSize;
    const height = entry.contentBoxSize[0].blockSize;
    canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
    canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
  }
});
observer.observe(canvas);

export function render(alpha) {
  renderPassDescriptor.colorAttachments[0].view =
    context.getCurrentTexture().createView();
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass(renderPassDescriptor);
  pass.setPipeline(pipeline);
  const aspect = canvas.width / canvas.height;
  for (const { scale, bindGroup, uniformBuffer, uniformValues } of objectInfos) {
    uniformValues.set([scale / aspect, scale], kScaleOffset);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    pass.setBindGroup(0, bindGroup);
    pass.draw(numVertices);
  }
  pass.end();
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}