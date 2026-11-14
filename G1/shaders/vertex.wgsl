struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec4f,
  @location(2) offset: vec3f,
  @location(3) scale: vec3f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@vertex fn vertexShader(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(vertex.position * vertex.scale + vertex.offset, 1.0);
  output.color = vertex.color;
  return output;
}