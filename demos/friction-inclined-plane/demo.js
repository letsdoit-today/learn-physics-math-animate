// Snap.svg Initialization
const s = Snap("#sim-svg");
const width = 700;
const height = 400;

// Physics Constants & State
const GRAVITY_MAG = 100 * 0.7; // Scaled to 70% of original
const PLANK_LENGTH = 500 * 0.7; // Scaled to 70% of original
const PIVOT_X = 600; // Keep pivot at same position
const PIVOT_Y = 350; // Keep pivot at same position
const BLOCK_SIZE = 60 * 0.7; // Scaled to 70% of original

let state = {
    angle: 0,          // Degrees
    angleRad: 0,       // Radians
    mu: 0.5,           // Friction coefficient
    mass: 10,          // Arbitrary mass unit (kg)
    g: 9.8,            // Gravity acceleration (m/s^2)
    time: 0,
    isSimulating: false,
    isPaused: false,
    isSliding: false,
    blockPos: -350 * 0.7,    // Scaled to 70% of original
    velocity: 0,
    simSpeed: 0.2      // Angle increment per frame
};

// UI Elements
const els = {
    btnStart: document.getElementById('btn-start'),
    btnPause: document.getElementById('btn-pause'),
    btnReset: document.getElementById('btn-reset'),
    muSlider: document.getElementById('mu-slider'),
    muVal: document.getElementById('mu-val'),
    valAngle: document.getElementById('val-angle'),
    valG: document.getElementById('val-g'),
    valN: document.getElementById('val-n'),
    valGx: document.getElementById('val-gx'),
    valFmax: document.getElementById('val-fmax'),
    valF: document.getElementById('val-f'),
    statusMsg: document.getElementById('status-msg')
};

// Graphics Groups
let layers = {
    static: s.group(),
    plank: s.group(),
    block: s.group(),
    vectors: s.group()
};

// Visual Elements
let visuals = {};

function init() {
    // 1. Draw Static Ground
    layers.static.add(s.line(50, PIVOT_Y, 650, PIVOT_Y).attr({
        stroke: "#7f8c8d",
        strokeWidth: 4,
        strokeLinecap: "round"
    }));

    // Pivot Point
    layers.static.add(s.circle(PIVOT_X, PIVOT_Y, 6).attr({
        fill: "#2c3e50"
    }));

    // 2. Draw Plank (Pivot at Right, extends Left)
    // Drawn from -Length to 0
    visuals.plank = s.rect(-PLANK_LENGTH, -10 * 0.7, PLANK_LENGTH, 20 * 0.7, 5 * 0.7).attr({
        fill: "#d35400",
        stroke: "#a04000",
        strokeWidth: 2 * 0.7
    });
    
    layers.plank.add(visuals.plank);
    layers.plank.transform(`t${PIVOT_X},${PIVOT_Y}`);

    // 3. Draw Block
    visuals.block = s.rect(-BLOCK_SIZE/2, -BLOCK_SIZE - 10 * 0.7, BLOCK_SIZE, BLOCK_SIZE).attr({
        fill: "#95a5a6",
        stroke: "#7f8c8d",
        strokeWidth: 2 * 0.7
    });
    
    // Block is added to a group that will move along the plank
    layers.block.add(visuals.block);
    layers.plank.add(layers.block); 

    // 4. Define Markers for Vectors
    // Helper to create arrow
    function createArrow(color) {
        const marker = s.path("M0,0 L0,6 L9,3 z").attr({fill: color}).marker(0,0,9,6,9,3);
        const path = s.path("M0,0 L0,0").attr({
            stroke: color,
            strokeWidth: 4 * 0.7, // Scaled to 70% of original
            markerEnd: marker
        });
        return path;
    }

    visuals.vecG = createArrow("#e74c3c"); // Gravity
    visuals.vecN = createArrow("#2ecc71"); // Normal
    visuals.vecF = createArrow("#3498db"); // Friction
    visuals.vecGx = createArrow("#9b59b6"); // Gx component

    // Add vectors to block group so they move with it
    layers.block.add(visuals.vecG, visuals.vecN, visuals.vecF, visuals.vecGx);

    // 5. Add Labels
    const labelSize = `${24 * 0.7}px`; // Scaled to 70% of original
    visuals.labelG = s.text(0, 0, "G").attr({ fill: "#e74c3c", textAnchor: "middle", dominantBaseline: "middle", fontSize: labelSize, fontWeight: "bold" });
    visuals.labelN = s.text(0, 0, "N").attr({ fill: "#2ecc71", textAnchor: "middle", dominantBaseline: "middle", fontSize: labelSize, fontWeight: "bold" });
    visuals.labelF = s.text(0, 0, "f").attr({ fill: "#3498db", textAnchor: "middle", dominantBaseline: "middle", fontSize: labelSize, fontWeight: "bold" });
    visuals.labelGx = s.text(0, 0, "Gx").attr({ fill: "#9b59b6", textAnchor: "middle", dominantBaseline: "middle", fontSize: labelSize, fontWeight: "bold", opacity: 0.5 });
    
    layers.block.add(visuals.labelG, visuals.labelN, visuals.labelF, visuals.labelGx);

    // Initial Render
    updatePhysics();
    draw();
    setupEvents();
}

function setupEvents() {
    els.muSlider.addEventListener('input', (e) => {
        state.mu = parseFloat(e.target.value);
        els.muVal.textContent = state.mu.toFixed(2);
        if (!state.isSimulating && !state.isSliding) {
            updatePhysics();
            draw();
        }
    });

    els.btnStart.addEventListener('click', () => {
        if (!state.isSimulating) {
            state.isSimulating = true;
            state.isPaused = false;
            els.btnStart.textContent = "进行中...";
            els.btnStart.disabled = true;
            loop();
        }
    });

    els.btnPause.addEventListener('click', () => {
        state.isPaused = !state.isPaused;
        els.btnPause.textContent = state.isPaused ? "继续" : "暂停";
    });

    els.btnReset.addEventListener('click', reset);
}

function reset() {
    state.angle = 0;
    state.angleRad = 0;
    state.isSimulating = false;
    state.isPaused = false;
    state.isSliding = false;
    state.blockPos = -350 * 0.7; // Scaled to 70% of original
    state.velocity = 0;
    
    els.btnStart.textContent = "开始抬升";
    els.btnStart.disabled = false;
    els.btnPause.textContent = "暂停";
    els.statusMsg.textContent = "静止状态";
    els.statusMsg.className = "status-normal";

    updatePhysics();
    draw();
}

function updatePhysics() {
    const g = state.g; 
    const m = state.mass;
    const mu = state.mu;

    const G = m * g;
    const N = G * Math.cos(state.angleRad);
    const Gx = G * Math.sin(state.angleRad); // Positive value magnitude
    const f_max = mu * N;

    let f = 0;

    if (state.isSliding) {
        f = mu * N; 
    } else {
        f = Gx; // Static friction balances gravity component
    }

    // Update UI Values
    els.valAngle.textContent = state.angle.toFixed(1) + "°";
    els.valG.textContent = G.toFixed(1) + " N";
    els.valN.textContent = N.toFixed(1) + " N";
    els.valGx.textContent = Gx.toFixed(1) + " N";
    els.valFmax.textContent = f_max.toFixed(1) + " N";
    els.valF.textContent = f.toFixed(1) + " N";

    return { G, N, Gx, f, f_max };
}

function loop() {
    if (!state.isSimulating) return;
    
    if (!state.isPaused) {
        const physics = updatePhysics();

        if (!state.isSliding) {
            // Check critical condition: tan(theta) > mu
            if (physics.Gx > physics.f_max) {
                state.isSliding = true;
                els.statusMsg.textContent = "物体开始下滑！(Gₓ > f_max)";
                els.statusMsg.className = "status-sliding";
            } else {
                // Increase angle
                if (state.angle < 80) { 
                    state.angle += state.simSpeed;
                    state.angleRad = state.angle * Math.PI / 180;
                }
            }
        } else {
            // Sliding dynamics
            // Gx pulls towards Pivot (Positive X in local space relative to start pos?)
            // Wait, Start pos is -400. Pivot is 0.
            // Gravity pulls towards 0 (Right).
            // So Gx acts in +X direction.
            // Friction acts in -X direction.
            
            const forceNet = physics.Gx - (state.mu * physics.N);
            const acc = forceNet / state.mass;
            
            state.velocity += acc * 0.5; // Time step scaling
            state.blockPos += state.velocity; // Moving towards 0 (positive direction)

            // Stop if hits pivot area (approx -BLOCK_SIZE/2) or falls off end?
            // Let's say it slides until x = 0
            if (state.blockPos > -BLOCK_SIZE/2) {
                state.isSimulating = false;
                els.btnStart.textContent = "演示结束";
                els.statusMsg.textContent = "物体到达底端";
            }
        }
    }

    draw();
    requestAnimationFrame(loop);
}

function draw() {
    // 1. Rotate Plank
    // Positive rotation (CW) to lift the Left end (which is at negative X)
    const tStr = `t${PIVOT_X},${PIVOT_Y} r${state.angle},0,0`; 
    layers.plank.transform(tStr);

    // 2. Position Block
    layers.block.transform(`t${state.blockPos},0`);

    // 3. Draw Vectors
    const scale = 2.0 * 0.7; // Scaled to 70% of original
    const physics = updatePhysics(); 
    
    const cx = 0;
    const cy = -10 * 0.7 - BLOCK_SIZE/2; // Scaled to 70% of original 

    // Gravity:
    // Local X axis points Right (Down-Slope).
    // Local Y axis points Down (Perpendicular to Slope).
    // Gravity is vertical down in Global.
    // Angle theta is CW rotation of Local relative to Global.
    // So Global is Rotated -theta relative to Local.
    // Vector (0, G) rotated by -theta.
    // x = 0*cos(-th) - G*sin(-th) = G*sin(th). (Positive X -> Down Slope).
    // y = 0*sin(-th) + G*cos(-th) = G*cos(th). (Positive Y -> Into Slope).
    
    const gLen = physics.G * scale;
    const gx = gLen * Math.sin(state.angleRad);
    const gy = gLen * Math.cos(state.angleRad);
    
    visuals.vecG.attr({
        d: `M${cx},${cy} l${gx},${gy}`
    });

    // Normal Force: Points UP (Negative Local Y)
    const nLen = physics.N * scale;
    visuals.vecN.attr({
        d: `M${cx},${cy} l0,${-nLen}`
    });

    // Friction: Opposes motion.
    // Motion is towards +X (Right). Friction points Left (-X).
    const fLen = physics.f * scale;
    visuals.vecF.attr({
        d: `M${cx},${cy + BLOCK_SIZE/2} l${-fLen},0` 
    });

    // Gx (Component): Pulls down slope (+X).
    const gxLen = physics.Gx * scale;
    visuals.vecGx.attr({
        d: `M${cx},${cy} l${gxLen},0`,
        opacity: 0.5 
    });

    // Update Labels
    // We apply a counter-rotation (r-state.angle) to keep text horizontal
    const labelOffset = 20 * 0.7; // Scaled to 70% of original
    
    // Gravity (At tip of G vector)
    visuals.labelG.attr({ x: cx + gx, y: cy + gy + labelOffset });
    visuals.labelG.transform(`r${-state.angle},${cx + gx},${cy + gy + labelOffset}`);

    // Normal (At tip of N vector)
    visuals.labelN.attr({ x: cx, y: cy - nLen - labelOffset });
    visuals.labelN.transform(`r${-state.angle},${cx},${cy - nLen - labelOffset}`);

    // Friction (At tip of f vector)
    visuals.labelF.attr({ x: cx - fLen - labelOffset, y: cy + BLOCK_SIZE/2 });
    visuals.labelF.transform(`r${-state.angle},${cx - fLen - labelOffset},${cy + BLOCK_SIZE/2}`);

    // Gx (At tip of Gx vector)
    visuals.labelGx.attr({ x: cx + gxLen + labelOffset, y: cy });
    visuals.labelGx.transform(`r${-state.angle},${cx + gxLen + labelOffset},${cy}`);
}

// Start
init();