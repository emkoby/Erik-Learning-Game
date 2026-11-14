export function initGeometry() {
  const vertices = [];
  const indices = [];
  const geometryData = {};
  let offset = 0;
  // Make triangle geometry
  const triangle = makeTriangle();
  geometryData["triangle"] = {
    firstIndex: indices.length,
    indexCount: triangle.indexData.length,
    baseVertex: offset,
  };
  vertices.push(...triangle.vertexData);
  indices.push(...triangle.indexData);
  offset += triangle.vertexData.length / 3;
  // Make square geometry
  const square = makeSquare();
  geometryData["square"] = {
    firstIndex: indices.length,
    indexCount: square.indexData.length,
    baseVertex: offset,
  };
  vertices.push(...square.vertexData);
  indices.push(...square.indexData);
  offset += square.vertexData.length / 3;
  // Add vertices and indices to geometryData
  geometryData["vertices"] = new Float32Array(vertices);
  geometryData["indices"] = new Uint32Array(indices);
  return geometryData;
}

function makeTriangle() {
  const vertexData = new Float32Array([
    0,
    0.5,
    0, // Vertex 0
    -0.5,
    -0.5,
    0, // Vertex 1
    0.5,
    -0.5,
    0, // Vertex 2
  ]);
  const indexData = new Uint16Array([0, 1, 2]);
  return { vertexData, indexData };
}

function makeSquare() {
  const vertexData = new Float32Array([
    -0.5,
    0.5,
    0, // Vertex 0
    -0.5,
    -0.5,
    0, // Vertex 1
    0.5,
    -0.5,
    0, // Vertex 2
    0.5,
    0.5,
    0, // Vertex 3
  ]);
  const indexData = new Uint16Array([0, 1, 2, 2, 3, 0]);
  return { vertexData, indexData };
}
