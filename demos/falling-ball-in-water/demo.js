document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const s = Snap("#sim-svg");
    const width = 800;
    const height = 500;
    
    // Physics constants
    const g = 9.8; // Gravity
    const rhoBall = 7800; // Steel density kg/m^3
    let rhoWater = 1000; // Water density kg/m^3
    const Cd = 0.47; // Drag coefficient for sphere
    
    // Simulation state
    let state = {
        running: false,
        time: 0,
        ball: {
            y: 50, // Initial Y position (pixels)
            v: 0,   // Velocity (m/s)
            r: 0.1, // Radius (m)
            m: 0    // Mass (kg)
        },
        pixelsPerMeter: 200, // Scale
        waterLevel: 200, // Y position of water surface (pixels)
        simulationData: [] // Store pre-calculated frames
    };
    
    // Visual elements
    let water, ball, container;
    let arrowG, arrowFb, arrowFd, arrowN;
    
    // DOM Elements
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const densitySlider = document.getElementById('density-slider');
    const densityVal = document.getElementById('density-val');
    const radiusSlider = document.getElementById('radius-slider');
    const radiusVal = document.getElementById('radius-val');
    const timeSlider = document.getElementById('time-slider');
    const timeVal = document.getElementById('time-val');
    const statusMsg = document.getElementById('status-msg');
    
    // Data display elements
    const valH = document.getElementById('val-h');
    const valV = document.getElementById('val-v');
    const valG = document.getElementById('val-g');
    const valFb = document.getElementById('val-fb');
    const valFd = document.getElementById('val-fd');
    const valN = document.getElementById('val-n');
    const valFnet = document.getElementById('val-fnet');

    function init() {
        drawScene();
        updatePhysicsParams(); // This will also calculate simulation
        addEventListeners();
        animate();
    }

    function updatePhysicsParams() {
        state.ball.r = parseFloat(radiusSlider.value);
        rhoWater = parseFloat(densitySlider.value);
        
        // Calculate mass: V = 4/3 * pi * r^3
        const volume = (4/3) * Math.PI * Math.pow(state.ball.r, 3);
        state.ball.m = rhoBall * volume;
        
        // Update display values
        radiusVal.textContent = state.ball.r.toFixed(2);
        densityVal.textContent = rhoWater;
        
        // Update visual ball size
        if(ball) {
            ball.attr({ r: state.ball.r * state.pixelsPerMeter });
        }
        
        // Pre-calculate simulation
        calculateSimulation();
        
        // Update time slider max
        const maxTime = state.simulationData[state.simulationData.length - 1].t;
        timeSlider.max = maxTime;
        
        // If not running, update state to current slider time (or 0 if reset)
        if (!state.running) {
             updateStateFromTime(parseFloat(timeSlider.value));
        }
    }
    
    function calculateSimulation() {
        state.simulationData = [];
        const dt = 0.001;
        let t = 0;
        let y = 50; // Initial Y
        let v = 0;
        const maxTime = 1; // Max simulation time
        
        // Simulation loop
        while (t <= maxTime) {
            // Calculate forces
            const G = state.ball.m * g;
            
            // Buoyancy
            let Vsub = 0;
            const distFromSurface = (y - state.waterLevel) / state.pixelsPerMeter;
            
            if (distFromSurface > state.ball.r) {
                Vsub = (4/3) * Math.PI * Math.pow(state.ball.r, 3);
            } else if (distFromSurface < -state.ball.r) {
                Vsub = 0;
            } else {
                const h = state.ball.r + distFromSurface;
                Vsub = (Math.PI * Math.pow(h, 2) / 3) * (3 * state.ball.r - h);
            }
            
            const Fb = rhoWater * g * Vsub;
            
            // Drag
            const immersionRatio = Vsub / ((4/3) * Math.PI * Math.pow(state.ball.r, 3));
            const area = Math.PI * Math.pow(state.ball.r, 2);
            const vDir = v > 0 ? 1 : -1;
            let Fd = 0.5 * Cd * rhoWater * area * Math.pow(v, 2) * immersionRatio * vDir;
            
            // Support Force (Normal Force)
            let N = 0;
            
            // Collision detection & Support Force
            if (y + state.ball.r * state.pixelsPerMeter >= height) {
                y = height - state.ball.r * state.pixelsPerMeter;
                v = 0;
                Fd = 0; // No drag when stopped
                // When settled at bottom, forces must balance: G = Fb + N
                // So N = G - Fb
                N = G - Fb;
                if (N < 0) N = 0; // Should not happen if ball sinks, but for safety
            }

            // Net Force (including N)
            // Forces: G (down), Fb (up), Fd (against v), N (up)
            // Taking down as positive for physics update (since y increases down)
            // Fnet = G - Fb - Fd - N
            // Note: Fd sign is already handled by vDir. If v > 0 (down), Fd > 0 (up in math, but our formula gives positive Fd).
            // Wait, let's check Fd logic:
            // vDir = 1 (down). Fd formula gives positive value.
            // Equation: a = Fnet / m. 
            // If Fd opposes motion, and motion is down (+), force should be up (-).
            // My code: Fnet = G - Fb - Fd.
            // If v > 0, Fd is positive number. So -Fd is negative (up). Correct.
            // If v < 0, vDir = -1. Fd becomes negative. -Fd becomes positive (down). Correct.
            
            const Fnet = G - Fb - Fd - N;
            
            // Store frame
            state.simulationData.push({
                t: t,
                y: y,
                v: v,
                G: G,
                Fb: Fb,
                Fd: Fd,
                N: N,
                Fnet: Fnet
            });
            
            // Update physics
            const a = Fnet / state.ball.m;
            v += a * dt;
            y += v * dt * state.pixelsPerMeter;
            
            // Re-check bounds to prevent sinking below floor in next step
            if (y + state.ball.r * state.pixelsPerMeter > height) {
                y = height - state.ball.r * state.pixelsPerMeter;
                v = 0;
            }
            
            t += dt;
        }
    }

    function updateStateFromTime(time) {
        // Find closest frame
        const frame = state.simulationData.find(f => f.t >= time) || state.simulationData[state.simulationData.length - 1];
        
        if (!frame) return;

        state.time = frame.t;
        state.ball.y = frame.y;
        state.ball.v = frame.v;
        
        // Update Visuals
        ball.attr({ cy: state.ball.y });
        
        // Update Arrows
        const arrowScale = 0.5;
        updateArrow(arrowG, width/2, state.ball.y, frame.G * arrowScale, 0, "G");
        updateArrow(arrowFb, width/2, state.ball.y, frame.Fb * arrowScale, 180, "Fb");
        updateArrow(arrowN, width/2, state.ball.y + state.ball.r * state.pixelsPerMeter, frame.N * arrowScale, 180, "N"); // Support force from bottom
        
        if (frame.Fd > 0) {
            updateArrow(arrowFd, width/2, state.ball.y, Math.abs(frame.Fd) * arrowScale, 180, "Fd");
        } else {
            updateArrow(arrowFd, width/2, state.ball.y, Math.abs(frame.Fd) * arrowScale, 0, "Fd");
        }
        
        // Update Display
        updateDisplay(frame.G, frame.Fb, frame.Fd, frame.N, frame.Fnet, frame.v);
        
        // Update slider UI
        timeVal.textContent = state.time.toFixed(2);
        if (Math.abs(parseFloat(timeSlider.value) - state.time) > 0.1) {
             timeSlider.value = state.time;
        }
    }

    function drawScene() {
        s.clear();
        
        // Draw Water
        water = s.rect(0, state.waterLevel, width, height - state.waterLevel);
        water.attr({
            fill: "rgba(52, 152, 219, 0.5)",
            stroke: "none"
        });
        
        // Draw Water Surface Line
        s.line(0, state.waterLevel, width, state.waterLevel).attr({
            stroke: "#2980b9",
            strokeWidth: 2
        });

        // Draw Ball
        ball = s.circle(width/2, state.ball.y, state.ball.r * state.pixelsPerMeter);
        ball.attr({
            fill: "#95a5a6",
            stroke: "#7f8c8d",
            strokeWidth: 2
        });
        
        // Draw Arrows group
        arrowG = createArrow("#e74c3c");
        arrowFb = createArrow("#3498db");
        arrowFd = createArrow("#f1c40f");
        arrowN = createArrow("#9b59b6");
    }

    function createArrow(color) {
        const g = s.group();
        const line = s.line(0, 0, 0, 50);
        const head = s.polygon(-5, 50, 5, 50, 0, 60);
        const label = s.text(10, 30, "");
        
        line.attr({ stroke: color, strokeWidth: 3 });
        head.attr({ fill: color });
        label.attr({ fill: color, fontSize: "14px", fontWeight: "bold" });
        
        g.add(line, head, label);
        g.attr({ display: 'none' }); // Hidden by default
        return g;
    }

    function updateArrow(arrowGroup, x, y, length, angle, text) {
        if (Math.abs(length) < 5) { // Hide if too small
            arrowGroup.attr({ display: 'none' });
            return;
        }
        
        arrowGroup.attr({ display: 'block' });
        
        // Re-draw line and head based on length
        const line = arrowGroup.select('line');
        const head = arrowGroup.select('polygon');
        const label = arrowGroup.select('text');
        
        line.attr({ y2: length });
        head.attr({ points: [-5, length, 5, length, 0, length + 10] });
        
        // Update Label
        label.attr({ text: text, y: length / 2 });
        
        // Position and Rotate
        let rotation = angle;
        
        const transform = `t${x},${y} r${rotation},0,0`;
        arrowGroup.attr({ transform: transform });
        
        // Fix label rotation (counter-rotate text so it stays upright?)
        // Actually, simple rotation rotates the text too. 
        // If angle is 180 (up), text will be upside down.
        // Let's fix text orientation.
        if (rotation === 180) {
             label.attr({ transform: `r180,${10},${length/2}` }); 
             // Local rotation around its center to flip it back? 
             // Simpler: transform the group, then apply counter-transform to text?
             // Or just position text appropriately.
             // If group is rotated 180, x=10 becomes x=-10 relative to origin.
             // Let's keep it simple first. The user asked for labels.
             // If text is upside down, we can adjust.
             // For 180 deg rotation, the whole group is flipped.
             // To keep text readable, we can rotate the text element by -180 (or 180) around its own center.
             // Or better: don't rotate the group for direction, just draw it up or down.
             // But my current logic relies on rotation.
             
             // Quick fix: Rotate text 180 around its center point if group is rotated 180
             // Get bounding box of text? Hard in abstract.
             // Let's try to flip it.
             label.attr({ transform: "r180" }); // relative to itself
             // Adjust position
             label.attr({ x: -25, y: length/2 });
        } else {
             label.attr({ transform: "r0" });
             label.attr({ x: 10, y: length/2 });
        }
    }

    function addEventListeners() {
        btnStart.addEventListener('click', () => {
            if (!state.running) {
                state.running = true;
                statusMsg.textContent = "运行中...";
                statusMsg.className = "status-running";
                btnStart.disabled = true;
                
                // If we are at the end, restart
                if (state.time >= timeSlider.max) {
                    state.time = 0;
                    timeSlider.value = 0;
                }
            }
        });

        btnPause.addEventListener('click', () => {
            state.running = !state.running;
            if (state.running) {
                btnPause.textContent = "暂停";
                statusMsg.textContent = "运行中...";
                statusMsg.className = "status-running";
            } else {
                btnPause.textContent = "继续";
                statusMsg.textContent = "已暂停";
                statusMsg.className = "status-paused";
            }
        });

        btnReset.addEventListener('click', reset);

        densitySlider.addEventListener('input', updatePhysicsParams);
        radiusSlider.addEventListener('input', updatePhysicsParams);
        
        timeSlider.addEventListener('input', () => {
            state.running = false; // Stop auto-play when user drags
            btnPause.textContent = "继续";
            statusMsg.textContent = "用户拖动";
            state.time = parseFloat(timeSlider.value);
            updateStateFromTime(state.time);
        });
    }

    function reset() {
        state.running = false;
        state.time = 0;
        timeSlider.value = 0;
        
        btnStart.disabled = false;
        btnPause.textContent = "暂停";
        statusMsg.textContent = "准备就绪";
        statusMsg.className = "status-normal";
        
        updateStateFromTime(0);
    }

    function animate() {
        requestAnimationFrame(animate);
        
        if (!state.running) return;

        // Advance time
        state.time += 0.016; // Real-time increment
        
        if (state.time > timeSlider.max) {
            state.time = parseFloat(timeSlider.max);
            state.running = false;
            statusMsg.textContent = "演示结束";
            statusMsg.className = "status-normal";
            btnStart.disabled = false;
        }
        
        // Sync slider
        timeSlider.value = state.time;
        
        // Update state
        updateStateFromTime(state.time);
    }
    
    function updateDisplay(G, Fb, Fd, N, Fnet, v) {
        valG.textContent = G.toFixed(2) + " N";
        valFb.textContent = Fb.toFixed(2) + " N";
        valFd.textContent = Math.abs(Fd).toFixed(2) + " N";
        valN.textContent = N.toFixed(2) + " N";
        valFnet.textContent = Fnet.toFixed(2) + " N";
        valV.textContent = v.toFixed(2) + " m/s";
        
        const h = (state.waterLevel - state.ball.y) / state.pixelsPerMeter; 
        valH.textContent = h.toFixed(2) + " m";
    }

    init();
});
