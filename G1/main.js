import * as render from "./render.js";
import { initGeometry } from "./geometry.js";

async function main() {
  // Initialize static geometry
  const geometryData = initGeometry();
  const init = await render.initialize(geometryData);
  // Initialize game state
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
