struct Vertex {
  @location(0) position: vec3f
};

@vertex fn vertexShader(vertex: Vertex) -> @builtin(position) vec4f {
  return vec4f(vertex.position, 1.0);
}