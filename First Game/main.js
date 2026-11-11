import * as render from './render.js';

async function main() {
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
    const alpha = Math.min(accumulatedTime / GAME_STEP, 1);
    render.render(alpha);
  }
  requestAnimationFrame((time) => {
    previousTime = time;
    requestAnimationFrame(gameLoop);
  });
}
main();