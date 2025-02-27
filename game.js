// Game variables
let scene, camera, renderer;
let car, road;
let isPlaying = false;
let roadSegments = [];
let roadCurve = [];
let deviceOrientation = { beta: 0, gamma: 0 };
let lastTime = 0;
let carPosition = 0; // Horizontal position of the car
let roadLength = 1000; // Length of the road
let roadWidth = 10;
let segmentLength = 10;
let cameraHeight = 2;
let speed = 0.05; // Car speed reduced from 0.2 to 0.05
let carDistance = 0; // Distance traveled

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0);
    camera.lookAt(0, 1, 10);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Create car
    createCar();
    
    // Generate initial road
    generateRoad();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start animation loop
    animate(0);
}

// Create the car model
function createCar() {
    // Simple car body
    const carBody = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red car
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    carBody.add(body);
    
    // Cabin
    const cabinGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 0.9, -0.2);
    carBody.add(cabin);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    
    const wheelPositions = [
        { x: -0.6, y: 0.3, z: 0.7 },
        { x: 0.6, y: 0.3, z: 0.7 },
        { x: -0.6, y: 0.3, z: -0.7 },
        { x: 0.6, y: 0.3, z: -0.7 }
    ];
    
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        carBody.add(wheel);
    });
    
    // Add car to scene
    carBody.position.set(0, 0, 0);
    scene.add(carBody);
    car = carBody;
}

// Generate a curved road
function generateRoad() {
    // Generate road curve points with seamless looping
    // Make sure the start and end points match for seamless looping
    const frequency = 0.05;
    const amplitude = 3;
    const cycleLength = Math.PI * 2 / frequency;
    const cycles = Math.ceil(roadLength / segmentLength / cycleLength);
    
    for (let i = 0; i < roadLength / segmentLength; i++) {
        const curveAmount = Math.sin(i * frequency) * amplitude;
        roadCurve.push(curveAmount);
    }
    
    // Create road segments
    const roadGroup = new THREE.Group();
    
    for (let i = 0; i < roadLength / segmentLength; i++) {
        const z = i * segmentLength;
        const x = roadCurve[i];
        
        // Road segment
        const segmentGeometry = new THREE.PlaneGeometry(roadWidth, segmentLength);
        const segmentMaterial = new THREE.MeshPhongMaterial({ 
            color: i % 2 === 0 ? 0x333333 : 0x444444,
            side: THREE.DoubleSide
        });
        
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.rotation.x = -Math.PI / 2;
        segment.position.set(x, 0, z + segmentLength / 2);
        
        roadGroup.add(segment);
        roadSegments.push(segment);
        
        // Add side grass
        const grassGeometry = new THREE.PlaneGeometry(20, segmentLength);
        const grassMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4CAF50,
            side: THREE.DoubleSide
        });
        
        // Left grass
        const leftGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.set(x - roadWidth / 2 - 10, -0.01, z + segmentLength / 2);
        roadGroup.add(leftGrass);
        
        // Right grass
        const rightGrass = new THREE.Mesh(grassGeometry, grassMaterial);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.set(x + roadWidth / 2 + 10, -0.01, z + segmentLength / 2);
        roadGroup.add(rightGrass);
    }
    
    scene.add(roadGroup);
    road = roadGroup;
}

// Set up event listeners
function setupEventListeners() {
    // Start button
    document.getElementById('start-button').addEventListener('click', startGame);
    
    // Stop button
    document.getElementById('stop-button').addEventListener('click', stopGame);
    
    // Device orientation for steering
    window.addEventListener('deviceorientation', handleOrientation);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Handle device orientation for steering
function handleOrientation(event) {
    if (!event.gamma || !event.beta) return;
    
    // Update device orientation data
    deviceOrientation.gamma = event.gamma; // Left/right tilt
    deviceOrientation.beta = event.beta;   // Front/back tilt
}

// Start the game
function startGame() {
    isPlaying = true;
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'block';
    
    // Request device orientation permission if needed
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            })
            .catch(console.error);
    }
}

// Stop the game
function stopGame() {
    isPlaying = false;
    document.getElementById('start-button').style.display = 'block';
    document.getElementById('stop-button').style.display = 'none';
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (isPlaying) {
        updateGame(deltaTime);
    }
    
    renderer.render(scene, camera);
}

// Update game state
function updateGame(deltaTime) {
    // Move car forward
    carDistance += speed * deltaTime;
    
    // Calculate current segment
    const currentSegment = Math.floor(carDistance / segmentLength) % (roadLength / segmentLength);
    
    // Get road curve at current position
    const targetX = roadCurve[currentSegment];
    
    // Steer car based on device orientation (gamma is left/right tilt)
    if (deviceOrientation.gamma) {
        // Clamp gamma between -30 and 30 degrees, then normalize to -1 to 1
        const steerInput = Math.max(-30, Math.min(30, deviceOrientation.gamma)) / 30;
        carPosition += steerInput * 0.05 * deltaTime;
        
        // Limit car position to road width
        carPosition = Math.max(-roadWidth/2 + 1, Math.min(roadWidth/2 - 1, carPosition));
    }
    
    // Update car position - use modulo to create seamless looping
    car.position.z = carDistance % roadLength;
    car.position.x = targetX + carPosition;
    car.rotation.y = Math.atan2(
        (targetX + carPosition) - car.position.x,
        0.1
    );
    
    // Update camera position to follow car
    camera.position.x = car.position.x;
    camera.position.z = car.position.z - 5;
    camera.lookAt(car.position.x, car.position.y + 1, car.position.z + 10);
    
    // If we've gone past the road length, reset position to create infinite road
    // but preserve the car's progress to avoid jumps
    if (carDistance > roadLength) {
        carDistance = carDistance % roadLength;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', init); 