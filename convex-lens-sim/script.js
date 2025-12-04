// Configuration
const CONFIG = {
    svgId: "#svg-canvas",
    width: 800,
    height: 500,
    centerX: 400,
    centerY: 250,
    f: 100, // Focal length in pixels
    lensHeight: 200,
    lensWidth: 30,
    axisLength: 700
};

// State
let state = {
    u: 300, // Object distance
    v: 150, // Image distance
    m: -0.5, // Magnification
    animating: false,
    animationSpeed: 0.5 // pixels per frame
};

// Snap Elements
let s;
let els = {
    objectArrow: null,
    imageArrow: null,
    rays: {
        parallel: null, // Ray parallel to axis -> focal point
        center: null,   // Ray through optical center
        virtualParallel: null, // Dashed extension for virtual image
        virtualCenter: null    // Dashed extension for virtual image
    },
    labels: {}
};

// Initialization
window.onload = function() {
    s = Snap(CONFIG.svgId);
    initStaticElements();
    initDynamicElements();
    bindControls();
    updateScene(state.u);
};

function initStaticElements() {
    // 1. Optical Axis
    s.line(
        CONFIG.centerX - CONFIG.axisLength/2, CONFIG.centerY,
        CONFIG.centerX + CONFIG.axisLength/2, CONFIG.centerY
    ).attr({ class: "axis" });

    // 2. Lens (Simple representation: Ellipse)
    s.ellipse(CONFIG.centerX, CONFIG.centerY, CONFIG.lensWidth/2, CONFIG.lensHeight/2)
     .attr({ class: "lens-shape" });
    
    // Lens vertical bisector (optional, for ray tracing visual aid)
    s.line(CONFIG.centerX, CONFIG.centerY - CONFIG.lensHeight/2, CONFIG.centerX, CONFIG.centerY + CONFIG.lensHeight/2)
     .attr({ stroke: "#3498db", strokeWidth: 1, strokeDasharray: "2,2", opacity: 0.5 });

    // 3. Points (F, 2F)
    const points = [
        { x: CONFIG.centerX - CONFIG.f, label: "F" },
        { x: CONFIG.centerX - 2*CONFIG.f, label: "2F" },
        { x: CONFIG.centerX + CONFIG.f, label: "F'" },
        { x: CONFIG.centerX + 2*CONFIG.f, label: "2F'" },
        { x: CONFIG.centerX, label: "O", offset: 15 }
    ];

    points.forEach(p => {
        s.circle(p.x, CONFIG.centerY, 4).attr({ class: "focus-point" });
        s.text(p.x - 5, CONFIG.centerY + (p.offset || 20), p.label).attr({ class: "text-label" });
    });
}

function initDynamicElements() {
    // Object Arrow (Blue)
    els.objectArrow = createArrow("#2980b9");
    
    // Image Arrow (Red)
    els.imageArrow = createArrow("#e74c3c");

    // Rays Group
    const rayAttr = { stroke: "#f39c12", strokeWidth: 2, fill: "none" };
    const virtualRayAttr = { stroke: "#f39c12", strokeWidth: 1, strokeDasharray: "4,4", fill: "none" };

    els.rays.parallel = s.path("").attr(rayAttr);
    els.rays.center = s.path("").attr(rayAttr);
    els.rays.virtualParallel = s.path("").attr(virtualRayAttr);
    els.rays.virtualCenter = s.path("").attr(virtualRayAttr);
}

function createArrow(color) {
    // Simple arrow path pointing up, height 60px default
    // We will transform it later
    const g = s.group();
    g.line(0, 0, 0, -60).attr({ stroke: color, strokeWidth: 4 });
    g.polygon(-5, -60, 5, -60, 0, -75).attr({ fill: color });
    return g;
}

// Physics Core
function calculatePhysics(u) {
    const f = CONFIG.f;
    
    // Avoid division by zero at u = f
    // In simulation, we cap u slightly away from f if needed, or handle Infinity
    if (Math.abs(u - f) < 0.1) {
        return { v: Infinity, m: Infinity, type: "Parallel" };
    }

    // Lens Formula: 1/f = 1/u + 1/v  =>  1/v = 1/f - 1/u  => v = (uf) / (u - f)
    const v = (u * f) / (u - f);
    const m = -v / u; // Magnification

    // Determine type
    let type = "";
    if (u > f) {
        type = "倒立 ";
        type += Math.abs(m) > 1 ? "放大 " : (Math.abs(m) < 1 ? "缩小 " : "等大 ");
        type += "实像";
    } else {
        type = "正立 放大 虚像";
    }

    return { v, m, type };
}

function updateScene(u) {
    // Update State
    const phys = calculatePhysics(u);
    state.u = u;
    state.v = phys.v;
    state.m = phys.m;

    // Update UI Text
    document.getElementById('val-u').textContent = Math.round(u);
    document.getElementById('slider-u').value = u;
    document.getElementById('data-u').textContent = Math.round(u);
    document.getElementById('data-v').textContent = Math.abs(phys.v) === Infinity ? "∞" : Math.round(phys.v);
    document.getElementById('data-m').textContent = Math.abs(phys.m) === Infinity ? "∞" : phys.m.toFixed(2);
    document.getElementById('data-type').textContent = phys.type;

    // Coordinate Mapping
    // Object X (Left of lens is negative in SVG relative to center? No, let's use absolute)
    // We defined CenterX = 400. Object is at 400 - u.
    const objX = CONFIG.centerX - u;
    const objY = CONFIG.centerY;
    const objH = 60; // Base height of object

    // Image X
    // If v is positive (Real), it's at 400 + v.
    // If v is negative (Virtual), it's at 400 + v (which is left of lens).
    const imgX = CONFIG.centerX + phys.v;
    
    // --- Draw Object ---
    // Reset transform and move
    els.objectArrow.transform(`t${objX},${objY}`);

    // --- Draw Image ---
    if (Math.abs(phys.v) === Infinity || Math.abs(phys.v) > 2000) {
        // Hide image if at infinity or too far
        els.imageArrow.attr({ opacity: 0 });
        els.rays.virtualParallel.attr({ path: "" });
        els.rays.virtualCenter.attr({ path: "" });
        
        // Just draw parallel rays exiting
        // Ray 1: ObjTop -> Lens -> Focus'
        const objTopY = objY - objH;
        const lensHitY = objTopY; // Parallel ray hits lens at same height
        
        // Path: Start -> Lens -> Extend Parallel
        // Actually parallel rays meet at infinity. 
        // Ray 1 (Parallel -> Focus): Still goes through F'.
        const ray1Path = `M${objX},${objTopY} L${CONFIG.centerX},${lensHitY} L${CONFIG.centerX + 1000},${CONFIG.centerY + (lensHitY - CONFIG.centerY) * (1 - 1000/CONFIG.f)}`; 
        // Wait, simplified: It passes through F' (400+f, 250).
        // Slope = (250 - lensHitY) / f.
        // Y at x=800: 250 + slope * (800 - (400+f))
        
        // Ray 2 (Center): Straight line
        const ray2Path = `M${objX},${objTopY} L${CONFIG.centerX + 1000},${objTopY + (250-objTopY)/u * (1000+u)}`;

        els.rays.parallel.attr({ path: `M${objX},${objTopY} L${CONFIG.centerX},${lensHitY} L${CONFIG.centerX+CONFIG.f},${CONFIG.centerY} l${CONFIG.f},${(CONFIG.centerY-lensHitY)}` }); // Just simplistic extension
        els.rays.center.attr({ path: `M${objX},${objTopY} L${CONFIG.centerX+500},${CONFIG.centerY + (500/u)*objH}` });
        
        return; 
    }

    els.imageArrow.attr({ opacity: 1 });
    
    // Image Transform: Translate to imgX, Scale by M
    // Note: Our arrow points UP by default (0, -60).
    // If M is negative (Real, Inverted), we scale Y by -1 (or just M).
    // M includes sign. If M = -0.5, image is inverted and half size.
    // transform string: translate(x,y) scale(1, m)
    // Important: Snap.svg scale defaults to center. We MUST scale around (0,0) to keep base on axis.
    els.imageArrow.transform(`t${imgX},${objY} s${Math.abs(phys.m)},${phys.m},0,0`); 

    // --- Draw Rays ---
    const objTopY = objY - objH;
    const imgTopY = objY - (objH * phys.m); // Calculate visually where the image tip is

    // 1. Parallel Ray: ObjTip -> Lens(at obj height) -> ImageTip
    // Starts at (objX, objTopY)
    // Hits lens at (centerX, objTopY)
    // Goes to (imgX, imgTopY)
    // We extend it a bit beyond image if real
    let ray1End = u > CONFIG.f ? 50 : 0; // Extra length extension
    els.rays.parallel.attr({
        path: `M${objX},${objTopY} L${CONFIG.centerX},${objTopY} L${imgX},${imgTopY}`
    });

    // 2. Center Ray: ObjTip -> Center(400,250) -> ImageTip
    els.rays.center.attr({
        path: `M${objX},${objTopY} L${CONFIG.centerX},${CONFIG.centerY} L${imgX},${imgTopY}`
    });

    // --- Virtual Image Handling ---
    if (u < CONFIG.f) {
        // Image is virtual (Left side).
        // Solid rays go to the RIGHT (diverging).
        // Dashed rays go to the LEFT (converging at image).
        
        // Recalculate Solid Rays (They originate from source, pass lens, and go out)
        // Ray 1 Solid part: Obj -> Lens -> Focus' -> Out
        // It must align with the virtual image point.
        // Slope from Lens(400, objTopY) to F'(400+f, 250).
        const slope1 = (CONFIG.centerY - objTopY) / CONFIG.f;
        const xEnd = 800;
        const yEnd1 = objTopY + slope1 * (xEnd - CONFIG.centerX);
        
        els.rays.parallel.attr({
            path: `M${objX},${objTopY} L${CONFIG.centerX},${objTopY} L${xEnd},${yEnd1}`
        });

        // Ray 2 Solid part: Obj -> Center -> Out
        const slope2 = (CONFIG.centerY - objTopY) / u; // Slope down
        const yEnd2 = CONFIG.centerY + slope2 * (xEnd - CONFIG.centerX); // Since center is (400,250)

        els.rays.center.attr({
            path: `M${objX},${objTopY} L${xEnd},${yEnd2}`
        });

        // Dashed Rays (Backwards from lens to image)
        // Ray 1 Dashed: From Lens(400, objTopY) back to Image(imgX, imgTopY)
        els.rays.virtualParallel.attr({
            path: `M${CONFIG.centerX},${objTopY} L${imgX},${imgTopY}`
        });

        // Ray 2 Dashed: From Center(400, 250) back to Image(imgX, imgTopY)
        els.rays.virtualCenter.attr({
            path: `M${CONFIG.centerX},${CONFIG.centerY} L${imgX},${imgTopY}`
        });

    } else {
        // Real Image
        // No virtual rays needed
        els.rays.virtualParallel.attr({ path: "" });
        els.rays.virtualCenter.attr({ path: "" });
    }
}

// Animation Loop
let animId;

function animate() {
    if (!state.animating) return;

    let nextU = state.u - state.animationSpeed;

    // Boundary checks
    // We want to stop before u becomes too small or hits 0
    // Target is "within 1 focal length". Let's stop at u = 30
    if (nextU <= 30) {
        state.animating = false;
        document.getElementById('btn-play').textContent = "开始演示";
        return;
    }

    // Skip the singularity at u = f roughly
    if (Math.abs(nextU - CONFIG.f) < 1) {
        nextU = CONFIG.f - 1.5; // Jump over
    }

    updateScene(nextU);
    animId = requestAnimationFrame(animate);
}

function bindControls() {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const slider = document.getElementById('slider-u');

    slider.addEventListener('input', (e) => {
        state.animating = false;
        btnPlay.textContent = "开始演示";
        updateScene(parseFloat(e.target.value));
    });

    btnPlay.addEventListener('click', () => {
        if (state.animating) return;
        // If we are at the end, reset to start
        if (state.u <= 35) {
            state.u = 350;
        }
        state.animating = true;
        btnPlay.textContent = "演示中...";
        animate();
    });

    btnPause.addEventListener('click', () => {
        state.animating = false;
        btnPlay.textContent = "继续演示";
    });

    btnReset.addEventListener('click', () => {
        state.animating = false;
        btnPlay.textContent = "开始演示";
        updateScene(300);
    });
}
