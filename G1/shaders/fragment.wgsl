struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) normal: vec3f,
};

@fragment fn fragmentShader(vertexOutput: VertexOutput) -> @location(0) vec4f {
  let lightDir = normalize(vec3f(10, 10, 10));
  let normal = normalize(vertexOutput.normal);
  let diffuse = max(dot(normal, lightDir), 0.0);
  return vec4f(vertexOutput.color.rgb * diffuse, vertexOutput.color.a);
}