export function initGeometry() {
  const vertices = [];
  const indices = [];
  const normals = [];
  const geometryData = {};
  let offset = 0;
  // Make cube geometry
  const cube = makeCube();
  geometryData["cube"] = {
    firstIndex: indices.length,
    indexCount: cube.indexData.length,
    baseVertex: offset,
  };
  vertices.push(...cube.vertexData);
  indices.push(...cube.indexData);
  normals.push(...cube.normalData);
  offset += cube.vertexData.length / 3;
  // Add vertices and indices to geometryData
  geometryData["vertices"] = new Float32Array(vertices);
  geometryData["indices"] = new Uint32Array(indices);
  geometryData["normals"] = new Float32Array(normals);
  return geometryData;
}

function makeCube() {
  const vertexData = new Float32Array([
    -1,
    -1,
    -1, // Vertex 0
    -1,
    -1,
    1, // Vertex 1
    1,
    -1,
    -1, // Vertex 2
    1,
    -1,
    1, // Vertex 3
    -1,
    1,
    -1, // Vertex 4
    -1,
    1,
    1, // Vertex 5
    1,
    1,
    -1, // Vertex 6
    1,
    1,
    1, // Vertex 7
  ]);
  const indexData = new Uint16Array([
    0,
    4,
    2,
    2,
    4,
    6, // Back face
    5,
    1,
    3,
    3,
    7,
    5, // Front face
    4,
    0,
    1,
    1,
    5,
    4, // Left face
    7,
    3,
    2,
    2,
    6,
    7, // Right face
    4,
    5,
    7,
    7,
    6,
    4, // Top face
    1,
    0,
    2,
    2,
    3,
    1, // Bottom face
  ]);
  const normalData = new Uint16Array([
    0,
    0,
    -1, // Back face
    0,
    0,
    1, // Front face
    -1,
    0,
    0, // Left face
    1,
    0,
    0, // Right face
    0,
    1,
    0, // Top face
    0,
    -1,
    0, // Bottom face
  ]);
  return { vertexData, indexData, normalData };
}
