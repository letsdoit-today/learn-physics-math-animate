const CONFIG = {
    svgId: "#svg-canvas",
    width: 800,
    height: 500,
    centerX: 400,
    centerY: 250,
    f: 100,
    lensHeight: 200,
    lensWidth: 30,
    axisLength: 700
};

let state = {
    u: 300,
    v: -75,
    m: 0.25,
    animating: false,
    animationSpeed: 0.5
};

// 暴露到全局作用域，供HTML中的语言切换使用
window.state = state;

let s;
let els = {
    objectArrow: null,
    imageArrow: null,
    lens: null,
    rays: {
        incidentParallel: null,
        refractedParallel: null,
        virtualFocus: null,
        virtualCenter: null,
        center: null
    },
    labels: {}
};

window.onload = function() {
    s = Snap(CONFIG.svgId);
    initStaticElements();
    initDynamicElements();
    bindControls();
    updateScene(state.u);
};

function initStaticElements() {
    s.line(
        CONFIG.centerX - CONFIG.axisLength/2, CONFIG.centerY,
        CONFIG.centerX + CONFIG.axisLength/2, CONFIG.centerY
    ).attr({ class: "axis" });

    
    const cx = CONFIG.centerX;
    const cy = CONFIG.centerY;
    const w = CONFIG.lensWidth;
    const h = CONFIG.lensHeight;
    
    const lensPath = s.path(`
        M ${cx - w/2},${cy - h/2}
        L ${cx + w/2},${cy - h/2}
        Q ${cx + 5},${cy} ${cx + w/2},${cy + h/2}
        L ${cx - w/2},${cy + h/2}
        Q ${cx - 5},${cy} ${cx - w/2},${cy - h/2}
        Z
    `).attr({ class: "lens-shape" });

    s.line(cx, cy - h/2, cx, cy + h/2)
     .attr({ stroke: "#3498db", strokeWidth: 1, strokeDasharray: "2,2", opacity: 0.5 });

    const points = [
        { x: cx - CONFIG.f, label: "F" },
        { x: cx - 2*CONFIG.f, label: "2F" },
        { x: cx + CONFIG.f, label: "F'" },
        { x: cx + 2*CONFIG.f, label: "2F'" },
        { x: cx, label: "O", offset: 15 }
    ];

    points.forEach(p => {
        s.circle(p.x, cy, 4).attr({ class: "focus-point" });
        s.text(p.x - 5, cy + (p.offset || 20), p.label).attr({ class: "text-label" });
    });
}

function initDynamicElements() {
    els.objectArrow = createArrow("#2980b9");
    els.imageArrow = createArrow("#e74c3c").attr({ opacity: 0.7 });

    const rayAttr = { stroke: "#f39c12", strokeWidth: 2, fill: "none" };
    const dashedRayAttr = { stroke: "#f39c12", strokeWidth: 1, strokeDasharray: "4,4", fill: "none" };

    els.rays.incidentParallel = s.path("").attr(rayAttr);
    els.rays.refractedParallel = s.path("").attr(rayAttr);
    els.rays.virtualFocus = s.path("").attr(dashedRayAttr);
    els.rays.virtualCenter = s.path("").attr(dashedRayAttr);
    els.rays.center = s.path("").attr(rayAttr);
}

function createArrow(color) {
    const g = s.group();
    g.line(0, 0, 0, -60).attr({ stroke: color, strokeWidth: 4 });
    g.polygon(-5, -60, 5, -60, 0, -75).attr({ fill: color });
    return g;
}

function calculatePhysics(u) {
    const f = -CONFIG.f;
    
    const v = (u * f) / (u - f);
    const m = -v / u;
    // 使用标识符而不是硬编码文本
    const typeKey = "image-type-upright-reduced-virtual";

    return { v, m, typeKey };
}

function getImageTypeText(typeKey) {
    switch(typeKey) {
        case "image-type-upright-reduced-virtual":
            return "正立、缩小、虚像";
        default:
            return typeKey;
    }
}

function updateScene(u) {
    const phys = calculatePhysics(u);
    state.u = u;
    state.v = phys.v;
    state.m = phys.m;

    document.getElementById('val-u').textContent = Math.round(u);
    document.getElementById('slider-u').value = u;
    document.getElementById('data-u').textContent = Math.round(u);
    document.getElementById('data-v').textContent = Math.round(phys.v);
    document.getElementById('data-m').textContent = phys.m.toFixed(2);
    // 使用全局函数获取翻译文本
    const typeText = getImageTypeText ? getImageTypeText(phys.typeKey) : phys.typeKey;
    document.getElementById('data-type').textContent = typeText;

    const cx = CONFIG.centerX;
    const cy = CONFIG.centerY;
    
    const objX = cx - u;
    const objY = cy;
    const objH = 60;

    const imgX = cx + phys.v;
    
    els.objectArrow.transform(`t${objX},${objY}`);

    els.imageArrow.transform(`t${imgX},${objY} s${phys.m},${phys.m},0,0`);

    const objTopY = objY - objH;
    const imgTopY = objY - (objH * phys.m);

    els.rays.incidentParallel.attr({
        path: `M${objX},${objTopY} L${cx},${objTopY}`
    });

    const slope = (objTopY - cy) / CONFIG.f;
    const xEnd = 800;
    const yEnd = cy + slope * (xEnd - (cx - CONFIG.f));
    
    els.rays.refractedParallel.attr({
        path: `M${cx},${objTopY} L${xEnd},${yEnd}`
    });

    els.rays.virtualFocus.attr({
        path: `M${cx},${objTopY} L${imgX},${imgTopY}`
    });

    const slopeCenter = (cy - objTopY) / (cx - objX);
    const yEndCenter = cy + slopeCenter * (xEnd - cx);

    els.rays.center.attr({
        path: `M${objX},${objTopY} L${cx},${cy} L${xEnd},${yEndCenter}`
    });

    els.rays.virtualCenter.attr({
        path: `M${cx},${cy} L${imgX},${imgTopY}`
    });
}

// 暴露到全局作用域，供HTML中的语言切换使用
window.updateScene = updateScene;

let animId;

function animate() {
    if (!state.animating) return;

    let nextU = state.u - state.animationSpeed;

    if (nextU <= 30) {
        state.animating = false;
        document.getElementById('btn-play').textContent = "开始演示";
        return;
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
