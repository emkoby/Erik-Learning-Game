export function makeTriangle() {
  const vertexData = new Float32Array([
    0,
    0.5,
    0, // Vertex 1
    -0.5,
    -0.5,
    0, // Vertex 2
    0.5,
    -0.5,
    0, // Vertex 3
  ]);
  const vertexCount = vertexData.length / 3;
  return { vertexData, vertexCount };
}
