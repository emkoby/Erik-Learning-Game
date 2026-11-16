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
  // Make pyramid geometry
  const pyramid = makePyramid();
  geometryData["pyramid"] = {
    firstIndex: indices.length,
    indexCount: pyramid.indexData.length,
    baseVertex: offset,
  };
  vertices.push(...pyramid.vertexData);
  indices.push(...pyramid.indexData);
  normals.push(...pyramid.normalData);
  offset += pyramid.vertexData.length / 3;
  // Add vertices and indices to geometryData
  geometryData["vertices"] = new Float32Array(vertices);
  geometryData["indices"] = new Uint32Array(indices);
  geometryData["normals"] = new Float32Array(normals);
  return geometryData;
}

function makeCube() {
  // 24 vertices: 4 per face
  const vertexData = new Float32Array([
    // Front (+Z)
    -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    // Back (-Z)
    1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1,
    // Right (+X)
    1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1,
    // Left (-X)
    -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1,
    // Top (+Y)
    -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1,
    // Bottom (-Y)
    -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1,
  ]);

  // Same order: each face's normal repeated 4 times
  const normalData = new Float32Array([
    // Front
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    // Top
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  ]);

  // 2 triangles per face, counter-clockwise when seen from outside
  const indexData = new Uint16Array([
    // Front
    0, 1, 2, 0, 2, 3,
    // Back
    4, 5, 6, 4, 6, 7,
    // Right
    8, 9, 10, 8, 10, 11,
    // Left
    12, 13, 14, 12, 14, 15,
    // Top
    16, 17, 18, 16, 18, 19,
    // Bottom
    20, 21, 22, 20, 22, 23,
  ]);
  return { vertexData, indexData, normalData };
}

function makePyramid() {
  const vertexData = new Float32Array([
    // Front (+Z)
    1, -1, 1, 0, 1, 0, -1, -1, 1,
    // Back (-Z)
    -1, -1, -1, 0, 1, 0, 1, -1, -1,
    // Right (+X)
    1, -1, -1, 0, 1, 0, 1, -1, 1,
    // Left (-X)
    -1, -1, 1, 0, 1, 0, -1, -1, -1,
    // Bottom (-Y)
    1, -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1,
  ]);

  const normalData = new Float32Array([
    // Front (+Z)
    0, 0, 1, 0, 0, 1, 0, 0, 1,
    // Back (-Z)
    0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Right (+X)
    1, 0, 0, 1, 0, 0, 1, 0, 0,
    // Left (-X)
    -1, 0, 0, -1, 0, 0, -1, 0, 0,
    // Bottom (-Y)
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  ]);

  const indexData = new Uint16Array([
    // Front (+Z)
    0, 1, 2,
    // Back (-Z)
    3, 4, 5,
    // Right (+X)
    6, 7, 8,
    // Left (-X)
    9, 10, 11,
    // Bottom (-Y)
    12, 13, 14, 12, 14, 15,
  ]);

  return { vertexData, indexData, normalData };
}
