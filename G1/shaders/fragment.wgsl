struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) normal: vec3f,
  @location(2) lightDirection: vec3f,
};

@fragment fn fragmentShader(vertexOutput: VertexOutput) -> @location(0) vec4f {
  let normal = normalize(vertexOutput.normal);
  let lightDirection = normalize(-vertexOutput.lightDirection);
  let diffuse = max(dot(normal, lightDirection), 0.0);
  return vec4f(vertexOutput.color.rgb * diffuse, vertexOutput.color.a);
}