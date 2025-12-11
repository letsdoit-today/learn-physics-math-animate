// 空气-水折射演示脚本
// 依赖: Snap.svg库

// 配置常量
const CONFIG = {
    SVG_WIDTH: 800,
    SVG_HEIGHT: 500,
    CENTER_X: 400,
    CENTER_Y: 250,
    AXIS_LENGTH: 700,
    RAY_LENGTH: 500,
    N1: 1.0,  // 空气折射率
    N2: 1.33  // 水的折射率
};

// 状态对象
let state = {
    angleDeg: 45,  // 入射角
    isPlaying: false,
    animationId: null,
    animationSpeed: 0.25  // 动画速度
};

// Snap.svg对象
let s;

// 元素引用
let els = {
    boundary: null,
    normal: null,
    rays: {
        i: null,  // 入射光线
        r: null,  // 反射光线
        t: null   // 折射光线
    },
    arcs: {
        i: null,  // 入射角弧线
        r: null,  // 反射角弧线
        t: null   // 折射角弧线
    },
    angleTexts: {
        i: null,  // 入射角文本
        r: null,  // 反射角文本
        t: null   // 折射角文本
    }
};

// 初始化函数
function init() {
    // 创建SVG画布
    s = Snap("#svg-canvas");
    
    // 初始化静态元素
    initStaticElements();
    
    // 初始化动态元素
    initDynamicElements();
    
    // 绑定控制事件
    bindControls();
    
    // 更新场景
    updateScene(state.angleDeg);
}

// 初始化静态元素
function initStaticElements() {
    // 光轴
    s.line(
        CONFIG.CENTER_X - CONFIG.AXIS_LENGTH/2, CONFIG.CENTER_Y,
        CONFIG.CENTER_X + CONFIG.AXIS_LENGTH/2, CONFIG.CENTER_Y
    ).attr({
        class: "axis"
    });
    
    // 界面线
    els.boundary = s.line(
        CONFIG.CENTER_X - CONFIG.AXIS_LENGTH/2, CONFIG.CENTER_Y,
        CONFIG.CENTER_X + CONFIG.AXIS_LENGTH/2, CONFIG.CENTER_Y
    ).attr({
        class: "boundary"
    });
    
    // 法线
    els.normal = s.line(
        CONFIG.CENTER_X, CONFIG.CENTER_Y - 200,
        CONFIG.CENTER_X, CONFIG.CENTER_Y + 200
    ).attr({
        class: "normal"
    });
    
    // 介质标签
    s.text(CONFIG.CENTER_X - 300, CONFIG.CENTER_Y - 20, "空气 n₁")
        .attr({
            class: "medium-label"
        });
        
    s.text(CONFIG.CENTER_X - 300, CONFIG.CENTER_Y + 40, "水 n₂")
        .attr({
            class: "medium-label"
        });
}

// 初始化动态元素
function initDynamicElements() {
    // 光线
    els.rays.i = s.path("").attr({
        class: "ray-i",
        fill: "none"
    });
    
    els.rays.r = s.path("").attr({
        class: "ray-r",
        fill: "none"
    });
    
    els.rays.t = s.path("").attr({
        class: "ray-t",
        fill: "none"
    });
    
    // 角度弧线
    els.arcs.i = s.path("").attr({
        class: "arc-i"
    });
    
    els.arcs.r = s.path("").attr({
        class: "arc-r"
    });
    
    els.arcs.t = s.path("").attr({
        class: "arc-t"
    });
    
    // 角度文本
    els.angleTexts.i = s.text(0, 0, "").attr({
        class: "angle-label"
    });
    
    els.angleTexts.r = s.text(0, 0, "").attr({
        class: "angle-label"
    });
    
    els.angleTexts.t = s.text(0, 0, "").attr({
        class: "angle-label"
    });
}

// 角度转换函数
function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function toDeg(radians) {
    return radians * 180 / Math.PI;
}

// 计算菲涅尔反射系数
function fresnel(n1, n2, thetai, thetat) {
    const ci = Math.cos(thetai);
    const ct = Math.cos(thetat);
    const rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2;
    const rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2;
    const R = 0.5 * (rs + rp);
    let T = 1 - R;
    if (!isFinite(T) || T < 0) T = 0;
    return { R, T };
}

// 生成弧线路径
function arcPath(cx, cy, r, sx, sy, ex, ey, sweep) {
    return `M${sx},${sy} A${r},${r} 0 0 ${sweep} ${ex},${ey}`;
}

// 更新场景
function updateScene(angleDeg) {
    // 更新入射角
    state.angleDeg = angleDeg;
    
    const n1 = CONFIG.N1;
    const n2 = CONFIG.N2;
    const cx = CONFIG.CENTER_X;
    const cy = CONFIG.CENTER_Y;
    const L = CONFIG.RAY_LENGTH;
    
    // 计算角度
    const thetai = toRad(angleDeg);
    const sint = Math.min(1, (n1 / n2) * Math.sin(thetai));
    const thetat = Math.asin(sint);
    
    // 计算菲涅尔系数
    const fr = fresnel(n1, n2, thetai, thetat);
    
    // 更新数据显示
    document.getElementById('val-angle').textContent = angleDeg.toFixed(1);
    document.getElementById('slider-angle').value = angleDeg;
    document.getElementById('data-n1').textContent = n1.toFixed(2);
    document.getElementById('data-n2').textContent = n2.toFixed(2);
    document.getElementById('data-theta-i').textContent = `${angleDeg.toFixed(1)}°`;
    document.getElementById('data-theta-r').textContent = `${angleDeg.toFixed(1)}°`;
    document.getElementById('data-theta-t').textContent = `${toDeg(thetat).toFixed(1)}°`;
    document.getElementById('data-R').textContent = fr.R.toFixed(2);
    document.getElementById('data-T').textContent = fr.T.toFixed(2);
    
    // 计算光线端点
    const ix0 = cx - L * Math.sin(thetai);
    const iy0 = cy - L * Math.cos(thetai);
    const irx = cx + L * Math.sin(thetai);
    const iry = cy - L * Math.cos(thetai);
    const tx = cx + L * Math.sin(thetat);
    const ty = cy + L * Math.cos(thetat);
    
    // 更新光线
    els.rays.i.attr({
        path: `M${ix0},${iy0} L${cx},${cy}`
    });
    
    els.rays.r.attr({
        path: `M${cx},${cy} L${irx},${iry}`
    });
    
    els.rays.t.attr({
        path: `M${cx},${cy} L${tx},${ty}`
    });
    
    // 根据反射/透射比调整光线粗细和透明度
    els.rays.r.attr({
        strokeWidth: 2 + 8 * fr.R,
        strokeOpacity: 0.6 + 0.4 * fr.R
    });
    
    els.rays.t.attr({
        strokeWidth: 2 + 8 * fr.T,
        strokeOpacity: 0.6 + 0.4 * fr.T
    });
    
    // 更新角度弧线
    const r = 60;
    
    // 入射角弧线
    const siX = cx, siY = cy - r;
    const eiX = cx - r * Math.sin(thetai), eiY = cy - r * Math.cos(thetai);
    els.arcs.i.attr({
        path: arcPath(cx, cy, r, siX, siY, eiX, eiY, 0)
    });
    
    // 反射角弧线
    const srX = cx, srY = cy - r;
    const erX = cx + r * Math.sin(thetai), erY = cy - r * Math.cos(thetai);
    els.arcs.r.attr({
        path: arcPath(cx, cy, r, srX, srY, erX, erY, 1)
    });
    
    // 折射角弧线
    const stX = cx, stY = cy + r;
    const etX = cx + r * Math.sin(thetat), etY = cy + r * Math.cos(thetat);
    els.arcs.t.attr({
        path: arcPath(cx, cy, r, stX, stY, etX, etY, 1)
    });
    
    // 更新角度文本
    const liX = cx - (r + 18) * Math.sin(thetai / 2);
    const liY = cy - (r + 18) * Math.cos(thetai / 2);
    const lrX = cx + (r + 18) * Math.sin(thetai / 2);
    const lrY = cy - (r + 18) * Math.cos(thetai / 2);
    const ltX = cx + (r + 18) * Math.sin(thetat / 2);
    const ltY = cy + (r + 18) * Math.cos(thetat / 2);
    
    els.angleTexts.i.attr({
        x: liX,
        y: liY,
        text: `θᵢ ${angleDeg.toFixed(1)}°`
    });
    
    els.angleTexts.r.attr({
        x: lrX,
        y: lrY,
        text: `θʳ ${angleDeg.toFixed(1)}°`
    });
    
    els.angleTexts.t.attr({
        x: ltX,
        y: ltY,
        text: `θᵗ ${toDeg(thetat).toFixed(1)}°`
    });
}

// 绑定控制事件
function bindControls() {
    // 播放按钮
    document.getElementById('btn-play').addEventListener('click', () => {
        if (state.angleDeg <= 0.1) {
            state.angleDeg = 60;  // 如果已经到0°，重置为60°
        }
        state.isPlaying = true;
        animate();
    });
    
    // 暂停按钮
    document.getElementById('btn-pause').addEventListener('click', () => {
        state.isPlaying = false;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
    });
    
    // 重置按钮
    document.getElementById('btn-reset').addEventListener('click', () => {
        state.isPlaying = false;
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }
        state.angleDeg = 45;
        document.getElementById('slider-angle').value = state.angleDeg;
        updateScene(state.angleDeg);
    });
    
    // 入射角滑块
    document.getElementById('slider-angle').addEventListener('input', (e) => {
        state.angleDeg = parseFloat(e.target.value);
        state.isPlaying = false;  // 停止动画
        updateScene(state.angleDeg);
    });
}

// 动画函数
function animate() {
    if (!state.isPlaying) return;
    
    // 更新入射角
    state.angleDeg -= state.animationSpeed;
    
    // 边界检查
    if (state.angleDeg <= 0) {
        state.angleDeg = 0;
        state.isPlaying = false;
        return;
    }
    
    // 更新滑块
    document.getElementById('slider-angle').value = state.angleDeg;
    
    // 更新场景
    updateScene(state.angleDeg);
    
    // 继续动画
    state.animationId = requestAnimationFrame(animate);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 暴露给全局作用域
window.updateScene = updateScene;
window.state = state;