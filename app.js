let scene, camera, renderer, system, audioCtx, mainGain;
const particleCount = 20000;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 2000);
    camera.position.z = 150;

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        pos[i3] = (Math.random() - 0.5) * 300;
        pos[i3+1] = (Math.random() - 0.5) * 300;
        pos[i3+2] = (Math.random() - 0.5) * 300;
        col[i3] = Math.random(); col[i3+1] = Math.random(); col[i3+2] = Math.random();
        vel[i3] = (Math.random() - 0.5) * 0.5;
        vel[i3+1] = (Math.random() - 0.5) * 0.5;
        vel[i3+2] = (Math.random() - 0.5) * 0.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.userData = { vel: vel };

    const mat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6
    });

    system = new THREE.Points(geo, mat);
    scene.add(system);

    setupAudio();
    animate();
}

function setupAudio() {
    window.addEventListener('mousedown', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            mainGain = audioCtx.createGain();
            mainGain.connect(audioCtx.destination);
            mainGain.gain.value = 0.05;
        }
    });
}

function harmonicScream(freq) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.1, audioCtx.currentTime + 3);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);
    osc.connect(g); g.connect(mainGain);
    osc.start(); osc.stop(audioCtx.currentTime + 3);
}

function animate() {
    requestAnimationFrame(animate);
    const p = system.geometry.attributes.position.array;
    const v = system.geometry.userData.vel;
    const time = Date.now() * 0.0001;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Силы самоорганизации (Boids-lite)
        p[i3] += v[i3] + Math.sin(time + p[i3+1]*0.01)*0.2;
        p[i3+1] += v[i3+1] + Math.cos(time + p[i3]*0.01)*0.2;
        p[i3+2] += v[i3+2];

        // Гравитация к центру при "старении"
        v[i3] -= p[i3] * 0.00001;
        v[i3+1] -= p[i3+1] * 0.00001;
        v[i3+2] -= p[i3+2] * 0.00001;
    }
    
    system.geometry.attributes.position.needsUpdate = true;
    system.rotation.y += 0.001;
    renderer.render(scene, camera);
}

window.addEventListener('mousedown', (e) => {
    const f = 50 + (e.clientY / window.innerHeight) * 500;
    harmonicScream(f);
    const p = system.geometry.attributes.position.array;
    // Взрыв - перезагрузка системы
    for(let i=0; i<particleCount*3; i++) {
        p[i] += (Math.random() - 0.5) * 50;
    }
});

init();