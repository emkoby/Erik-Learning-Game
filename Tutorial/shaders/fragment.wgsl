struct OurStruct {
  color: vec4f,
  scale: vec2f,
  offset: vec2f,
};

@group(0) @binding(0) var<uniform> ourStruct: OurStruct;

@fragment fn fragmentShader() -> @location(0) vec4f {
  return ourStruct.color;
}