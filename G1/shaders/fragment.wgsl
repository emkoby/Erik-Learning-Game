struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@fragment fn fragmentShader(vertexOutput: VertexOutput) -> @location(0) vec4f {
  return vertexOutput.color;
}