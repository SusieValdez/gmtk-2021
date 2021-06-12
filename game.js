kaboom({
  global: true,
  fullscreen: true,
  scale: 2,
  clearColor: [0, 0, 0, 1],
});

// Constants
const TILE_WIDTH = 64;
const PLAYER_SPEED = 200;
const OTHER_PLAYER_SPEED = 190;
const GHOST_SPEED = 50;

// Tags
const INTERACTABLE = "INTERACTABLE";

// Images
loadRoot("images/");
[
  "man",
  "dog",
  "ghost",
  "key",
  "floor",
  "door-front",
  "door-side",
  "wood-wall-front",
  "wood-wall-side",
  "garden-wall",
  "table",
  "barrel",
  "chair-front",
  "bed",
].forEach((spriteName) => loadSprite(spriteName, spriteName + ".png"));

// Map
const map = [
  "++++++++++++++++++++++++++++++++++++++++",
  "+                                      +",
  "+                                      +",
  "+                                      +",
  "+                                      +",
  "+                                      +",
  "+                                      +",
  "+                                      +",
  "#---#-[-#----------------------#--[----#",
  "#   #   #                      #       #",
  "#   #   #                      #       #",
  "#   #   #                      =       #",
  "#   #   #                      #       #",
  "#---#   #-----[----------------#-------#",
  "#   #   #                      #       #",
  "#   #   #                      =       #",
  "#   #   #                      #       #",
  "#   #   #                      #       #",
  "#---#   #                      #       #",
  "#   #   #                      #       #",
  "#   #   #                      #       #",
  "#   #   #                      #       #",
  "#---#   #-----#----------#-----#       #",
  "#bB #   #     #          #             #",
  "#   #   #     #          #             #",
  "#  c#   #                              #",
  "#  t#   #                              #",
  "#   =   #     #          #             #",
  "#   #   #     #          #             #",
  "-------------------[[-------------------",
];
// Movement directions
const dirs = {
  w: vec2(0, -1),
  s: vec2(0, 1),
  a: vec2(-1, 0),
  d: vec2(1, 0),
};

const closest = (obj, objs) => {
  let closestObj = {
    pos: vec2(Infinity),
  };
  for (o of objs) {
    if (obj.pos.dist(o.pos) < obj.pos.dist(closestObj.pos)) {
      closestObj = o;
    }
  }
  return closestObj;
};

const moveTowards = (obj, pos, speed) => {
  obj.move(pos.sub(obj.pos).unit().scale(speed));
};

layers(["floor", "objects"], "objects");

scene("main", () => {
  add([sprite("floor"), pos(0, 0)]);
  addLevel(map, {
    width: TILE_WIDTH,
    height: TILE_WIDTH,
    "[": [sprite("door-front")],
    "=": [sprite("door-side")],
    "-": [sprite("wood-wall-front"), solid()],
    "#": [sprite("wood-wall-side"), solid()],
    "+": [sprite("garden-wall"), solid()],
    b: [sprite("barrel"), solid()],
    B: [sprite("bed"), solid()],
    c: [sprite("chair-front"), solid()],
    t: [sprite("table"), solid()],
    k: [sprite("key"), area(vec2(-16), vec2(32)), INTERACTABLE],
  });

  const man = add([
    sprite("man"),
    pos(3 * TILE_WIDTH, 23 * TILE_WIDTH),
    solid(),
  ]);

  const dog = add([
    sprite("dog"),
    pos(1 * TILE_WIDTH, 24 * TILE_WIDTH),
    solid(),
  ]);

  const ghost = add([sprite("ghost"), pos(180, 200)]);

  const state = {
    activePlayer: man,
    otherPlayer: dog,
    currentInteractable: undefined,
    beingCalled: false,
  };

  // Player movement
  for (const dir in dirs) {
    keyDown(dir, () => {
      state.activePlayer.move(dirs[dir].unit().scale(PLAYER_SPEED));
    });
  }

  // Interact
  function interact(object) {
    destroy(object);
  }

  keyPress("e", () => {
    if (state.activePlayer !== man || state.currentInteractable === undefined) {
      return;
    }
    interact(state.currentInteractable);
  });

  keyPress("q", () => {
    state.beingCalled = !state.beingCalled;
  });

  // Other player movement
  state.otherPlayer.action(() => {
    if (state.beingCalled) {
      moveTowards(
        state.otherPlayer,
        state.activePlayer.pos,
        OTHER_PLAYER_SPEED
      );
    }
  });

  // Ghost movement
  ghost.action(() => {
    var closestPlayer = closest(ghost, [state.activePlayer, state.otherPlayer]);
    moveTowards(ghost, closestPlayer.pos, GHOST_SPEED);
  });

  // Switching players
  keyPress("space", () => {
    if (state.activePlayer === man) {
      state.activePlayer = dog;
      state.otherPlayer = man;
    } else {
      state.activePlayer = man;
      state.otherPlayer = dog;
    }
  });

  // Set currentInteractable on collision
  state.activePlayer.collides(INTERACTABLE, (i) => {
    state.currentInteractable = i;
  });
  state.activePlayer.action(() => {
    if (state.currentInteractable === undefined) {
      return;
    }
    if (!state.activePlayer.isCollided(state.currentInteractable)) {
      state.currentInteractable = undefined;
    }
  });

  // Camera follows active activePlayer
  state.activePlayer.action(() => {
    camPos(state.activePlayer.pos);
  });

  // Resolve collisions
  man.action(man.resolve);
  dog.action(dog.resolve);
});

start("main");
