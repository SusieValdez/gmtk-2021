kaboom({
  global: true,
  fullscreen: true,
  scale: 2,
  clearColor: [0, 0, 0, 1],
});

const isDebugging = false;

debug.inspect = isDebugging;

// Constants
const TILE_WIDTH = 64;
const PLAYER_SPEED = isDebugging ? 1000 : 200;
const OTHER_PLAYER_SPEED = 190;
const GHOST_SPEED = 50;
const BOUNCY_GHOST_SPEED = 90;

// Tags
const TAG_INTERACTABLE = "TAG_INTERACTABLE";
const TAG_KEY = "TAG_KEY";
const TAG_WALL = "TAG_WALL";
const TAG_GHOST = "TAG_GHOST";
const TAG_BOUNCY_GHOST = "TAG_BOUNCY_GHOST";
const TAG_BOUNCY_HORIZONTAL_GHOST = "TAG_BOUNCY_HORIZONTAL_GHOST";
const TAG_BOUNCY_VERTICAL_GHOST = "TAG_BOUNCY_VERTICAL_GHOST";
const TAG_EXIT = "TAG_EXIT";

// Images
loadRoot("images/");
[
  "man",
  "dog",
  "ghost",
  "ghost-2",
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
  "bookcase",
  "bookcase-side",
].forEach((spriteName) => loadSprite(spriteName, spriteName + ".png"));

// Audio
loadRoot("audio/");
loadSound("music", "Winter.mp3");
loadSound("key-pickup", "Key_Lock_Door_29.wav");
loadSound("door-unlock", "Key_Lock_Door_42.wav");
loadSound("ghost-1", "ghost.wav");
loadSound("ghost-2", "qubodup-GhostMoan01.mp3");
loadSound("ghost-3", "qubodup-GhostMoan02.mp3");
loadSound("ghost-4", "qubodup-GhostMoan03.mp3");
loadSound("ghost-5", "qubodup-GhostMoan04.mp3");
loadSound("applause", "Well Done CCBY3.ogg");

// Map
const map = [
  "++++++++++++++++++++++++++++++++++++++++",
  "+       +       g     +       +        +",
  "+   +++  +++++++++  + + +++++ +  ++++ ++",
  "+++    +    +       +   +       + G +  +",
  "+ ++    +++ ++ +++++++++++++++++    +  +",
  "+   +   +  G+         g        +       +",
  "+   +   +   +++++++++++++  +++ +++  ++ +",
  "+++++   +                    +   +     +",
  "#---#-[-#----------------------#----[--#",
  "#Bb #   #              G       #       #",
  "#   #   #   ttt tttGttt ttt    #       #",
  "#   #   #      G               =       #",
  "#   #   #  G                   #       #",
  "#---#   #-----[----------------#-------#",
  "#   #   #          b           #VVVVVVv#",
  "#   #   #g  ccccccccccccccc  G =    G v#",
  "# c #   #   tttttttttttttttg   #VVVV  v#",
  "#Bt #   #  G              tG   # G    v#",
  "#---#   #   cccccccccccccct    #  vVVVv#",
  "#   #   #g  tttttttttttttttg   #  V G v#",
  "#   #   #     G   G   G   G    #      v#",
  "#   #   #   G   G   G   G      #VVVv  v#",
  "#---#   #-----#----------#-----#  Gv  v#",
  "#bB #   #     #          #VVVVVV   V  v#",
  "#   #   #     #          #g G         v#",
  "#  c#   #                     v vVVVVVv#",
  "#  t#   #                     v vg    v#",
  "# k =   #     #          #VVVVV VVV   v#",
  "#   #   #     #          #            v#",
  "-------------------55-------------------",
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

const hasTag = (object, tag) => object._tags.indexOf(tag) >= 0;

layers(["floor", "objects"], "objects");

scene("main", ({ deathCount }) => {
  add([sprite("floor"), pos(0, 0)]);
  addLevel(map, {
    width: TILE_WIDTH,
    height: TILE_WIDTH,
    "[": [sprite("door-front")],
    5: [sprite("door-front"), TAG_EXIT],
    "=": [sprite("door-side")],
    "-": [sprite("wood-wall-front"), solid(), TAG_WALL],
    "#": [sprite("wood-wall-side"), solid(), TAG_WALL],
    "+": [sprite("garden-wall"), solid(), TAG_WALL],
    b: [sprite("barrel"), area(vec2(12, 0), vec2(52, 64)), solid(), TAG_WALL],
    B: [sprite("bed"), area(vec2(16, 0), vec2(48, 64)), solid(), TAG_WALL],
    V: [sprite("bookcase"), solid(), TAG_WALL],
    v: [sprite("bookcase-side"), solid(), TAG_WALL],
    c: [sprite("chair-front"), area(vec2(16), vec2(48)), solid(), TAG_WALL],
    t: [sprite("table"), solid(), TAG_WALL],
    g: [
      sprite("ghost-2"),
      area(vec2(16, 16), vec2(48, 48)),
      solid(),
      TAG_GHOST,
      TAG_BOUNCY_GHOST,
      TAG_BOUNCY_HORIZONTAL_GHOST,
      {
        dir: 1,
      },
    ].concat(isDebugging ? [color(1, 0, 0)] : []),
    G: [
      sprite("ghost-2"),
      area(vec2(16, 16), vec2(48, 48)),
      solid(),
      TAG_GHOST,
      TAG_BOUNCY_GHOST,
      TAG_BOUNCY_VERTICAL_GHOST,
      {
        dir: 1,
      },
    ].concat(isDebugging ? [color(0, 1, 0)] : []),
    k: [
      sprite("key"),
      area(vec2(-16), vec2(28)),
      color(1, 0, 0),
      TAG_INTERACTABLE,
      TAG_KEY,
    ],
  });

  const man = add(
    [sprite("man"), pos(3 * TILE_WIDTH, 23 * TILE_WIDTH)].concat(
      isDebugging ? [solid()] : []
    )
  );

  const dog = add([
    sprite("dog"),
    pos(1 * TILE_WIDTH, 24 * TILE_WIDTH),
    solid(),
  ]);

  add([
    text(
      "WASD: move\nQ: call dog \nSPACE: switch to dog mode\nE: pick up items\nExit house to win!"
    ),
    pos(2 * TILE_WIDTH, 24 * TILE_WIDTH),
  ]);

  const ghost = add([sprite("ghost"), pos(180, 200), TAG_GHOST]);

  const state = {
    activePlayer: man,
    otherPlayer: dog,
    currentInteractable: undefined,
    beingCalled: false,
    playerPaused: false,
  };

  const startTime = new Date();

  const music = play("music");

  const die = () => {
    state.playerPaused = true;
    camShake(50);
    music.stop();
    var randomSong = Math.floor(Math.random() * 5) + 1;
    play("ghost-" + randomSong);
    setTimeout(() => {
      go("main", { deathCount: deathCount + 1 });
    }, 1000);
  };

  // Player movement
  for (const dir in dirs) {
    keyDown(dir, () => {
      if (state.playerPaused) {
        return;
      }
      state.activePlayer.move(dirs[dir].unit().scale(PLAYER_SPEED));
    });
  }

  // Interact
  function interact(object) {
    if (hasTag(object, TAG_KEY)) {
      play("key-pickup");
    }
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

  // Ghost-2 behaviour
  action(TAG_BOUNCY_HORIZONTAL_GHOST, (g) => {
    g.move(g.dir * BOUNCY_GHOST_SPEED, 0);
  });

  action(TAG_BOUNCY_VERTICAL_GHOST, (g) => {
    g.move(0, g.dir * BOUNCY_GHOST_SPEED);
  });

  collides(TAG_BOUNCY_GHOST, TAG_WALL, (g) => {
    g.dir *= -1;
  });

  state.activePlayer.collides(TAG_GHOST, (_g) => {
    die();
  });

  state.otherPlayer.collides(TAG_GHOST, (_g) => {
    die();
  });

  // Win condition
  state.activePlayer.collides(TAG_EXIT, (_g) => {
    go("win", { startTime, deathCount });
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
  state.activePlayer.collides(TAG_INTERACTABLE, (i) => {
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

scene("win", ({ startTime, deathCount }) => {
  const timeTaken = (new Date() - startTime) / 1000;
  play("applause");
  add([
    text(
      `You won!\nTime taken (s): ${timeTaken}\nDeath count: ${deathCount}`,
      32
    ),
  ]);
});

start("main", { deathCount: 0 });
