// Game variables
let scene, camera, renderer;
let car, road;
let isPlaying = false;
let roadSegments = [];
let roadCurve = [];
let deviceOrientation = { beta: 0, gamma: 0, alpha: 0 };
let screenOrientation = window.orientation || 0;
let lastTime = 0;
let carPosition = 0;
let roadLength = 1000;
let roadWidth = 10;
let segmentLength = 10;
let cameraHeight = 2;
let speed = 0.05;
let carDistance = 0;

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    // Position camera to see the road and car
    camera.position.set(0, 8, -10);
    camera.lookAt(0, 0, 10);
    
    // Create renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create initial road
    createRoad();
    
    // Create car
    createCar();
    
    // Add event listeners
    setupEventListeners();
    
    // Start animation loop
    animate(0);
}

function createRoad() {
    // Create a basic road
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2; // Lay flat
    road.position.z = roadLength / 2; // Position in front of camera
    scene.add(road);
    
    // Add side strips
    const stripWidth = 0.3;
    const stripMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    
    // Left strip
    const leftStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(stripWidth, roadLength),
        stripMaterial
    );
    leftStrip.rotation.x = -Math.PI / 2;
    leftStrip.position.set(-roadWidth/2, 0.01, roadLength/2);
    scene.add(leftStrip);
    
    // Right strip
    const rightStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(stripWidth, roadLength),
        stripMaterial
    );
    rightStrip.rotation.x = -Math.PI / 2;
    rightStrip.position.set(roadWidth/2, 0.01, roadLength/2);
    scene.add(rightStrip);
}

function createCar() {
    // Create car body
    const carGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        shininess: 80
    });
    car = new THREE.Mesh(carGeometry, carMaterial);
    
    // Position car
    car.position.set(0, 1, 0);
    scene.add(car);
    
    // Add wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    // Create and position 4 wheels
    const wheelPositions = [
        [-1, -0.3, -1.5], // back left
        [1, -0.3, -1.5],  // back right
        [-1, -0.3, 1.5],  // front left
        [1, -0.3, 1.5]    // front right
    ];
    
    wheelPositions.forEach(position => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...position);
        car.add(wheel);
    });
}

function animate(time) {
    requestAnimationFrame(animate);
    
    if (!renderer) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (isPlaying) {
        // Update car position
        car.position.z += speed * deltaTime;
        
        // Update camera to follow car
        camera.position.z = car.position.z - 10;
        camera.lookAt(car.position.x, 0, car.position.z + 10);
    }
    
    renderer.render(scene, camera);
}

function setupEventListeners() {
    document.getElementById('start-button').addEventListener('click', () => {
        isPlaying = true;
    });
    
    document.getElementById('stop-button').addEventListener('click', () => {
        isPlaying = false;
    });
    
    document.getElementById('restart-button').addEventListener('click', () => {
        car.position.set(0, 1, 0);
        camera.position.set(0, 8, -10);
        camera.lookAt(0, 0, 10);
        isPlaying = false;
    });
    
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize when page loads
window.addEventListener('load', init);
