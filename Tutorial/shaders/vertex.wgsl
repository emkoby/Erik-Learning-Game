struct OurStruct {
  color: vec4f,
  scale: vec2f,
  offset: vec2f,
};

struct Vertex {
  position: vec2f,
};

@group(0) @binding(0) var<uniform> ourStruct: OurStruct;
@group(0) @binding(1) var<storage, read> vertexBuffer: array<Vertex>;

@vertex fn vertexShader(
  @builtin(vertex_index) vertexIndex : u32
) -> @builtin(position) vec4f {
  return vec4f(
    vertexBuffer[vertexIndex].position * ourStruct.scale + ourStruct.offset, 0.0, 1.0);
}