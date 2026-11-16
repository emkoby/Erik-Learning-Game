struct Camera { viewProj: mat4x4f };

struct ObjectData {
  model: mat4x4f,
  world: mat4x4f,
  color: vec4f,
  lightDirection: vec3f
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) normal: vec3f,
  @location(2) lightDirection: vec3f,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> objects: array<ObjectData>;

@vertex fn vertexShader(vertex: Vertex, @builtin(instance_index) i: u32) -> VertexOutput {
  var output: VertexOutput;
  let object = objects[i];
  output.position = camera.viewProj * object.model * vec4f(vertex.position, 1.0);
  output.color = object.color;
  output.normal = (object.world * vec4f(vertex.normal, 0.0)).xyz;
  output.lightDirection = object.lightDirection;
  return output;
}