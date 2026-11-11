import * as render from "./render.js";
import * as geometry from "./geometry.js";

async function main() {
  // Initialize game state
  // const { staticVertexData, staticVertexCount } = levelGenerator.generateLevel();
  // const { staticVertexData, staticVertexCount } = geometry.makeCube();
  const { staticVertexData, staticVertexCount } = geometry.makeTriangle();
  const init = await render.initialize(staticVertexData, staticVertexCount);
  // Game loop
  const GAME_STEP = 1 / 60;
  const MAX_FRAME_TIME = 0.25;
  let previousTime = 0;
  let accumulatedTime = 0;
  function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    let deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    if (deltaTime > MAX_FRAME_TIME) {
      deltaTime = MAX_FRAME_TIME;
    }

    // Game logic
    accumulatedTime += deltaTime;
    while (accumulatedTime >= GAME_STEP) {
      accumulatedTime -= GAME_STEP;
    }

    // Game rendering
    const ALPHA = Math.min(accumulatedTime / GAME_STEP, 1);
    render.render(init, ALPHA);
  }
  requestAnimationFrame((time) => {
    previousTime = time;
    requestAnimationFrame(gameLoop);
  });
}
main();
