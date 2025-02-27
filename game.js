// Game variables
let scene, camera, renderer;
let car, road;
let isPlaying = false;
let roadSegments = [];
let roadCurve = [];
let deviceOrientation = { beta: 0, gamma: 0, alpha: 0 };
let screenOrientation = window.orientation || 0;
let lastTime = 0;
let carPosition = 0; // Horizontal position of the car
let roadLength = 1000; // Length of the road
let roadWidth = 10;
let segmentLength = 10;
let cameraHeight = 2;
let speed = 0.05; // Car speed reduced from 0.2 to 0.05
let carDistance = 0; // Distance traveled
let debugMode = false;
let steerValue = 0;
let trees = []; // Array to store tree objects
let obstacles = []; // Array to store obstacles
let roadMountains = []; // Array to store mountains on the road
let explosionParticles = []; // Array for explosion particles
let flames = []; // Array for car flames
let gameOver = false;
let explosionTime = 0;
let carSpeed = 0; // Current car speed for deceleration

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
    
    // Add distant mountains
    createMountains();
    
    // Create car
    createCar();
    
    // Generate initial road
    generateRoad();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start animation loop
    animate(0);
}

// Create distant mountains for scenery
function createMountains() {
    const mountainGroup = new THREE.Group();
    
    // Create several mountain ranges at different distances and along the road
    for (let range = 0; range < 3; range++) {
        const distance = 100 + range * 50; // Distance from road
        const rangeWidth = 800; // Width of mountain range (increased)
        const mountainCount = 25 + range * 5; // More mountains
        
        // Create mountains along the entire road length
        for (let roadSection = 0; roadSection < 3; roadSection++) {
            const zOffset = roadSection * (roadLength / 3);
            
            for (let i = 0; i < mountainCount; i++) {
                // Position along the range
                const position = (i / mountainCount) * rangeWidth - rangeWidth / 2;
                
                // Create mountain geometry
                const height = 20 + Math.random() * 30;
                const radius = 10 + Math.random() * 20;
                
                const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
                const mountainMaterial = new THREE.MeshPhongMaterial({
                    color: range === 0 ? 0x4682B4 : (range === 1 ? 0x708090 : 0x778899), // Different blue-gray shades
                    flatShading: true
                });
                
                const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
                
                // Position the mountain
                mountain.position.set(
                    position + (Math.random() - 0.5) * 60, // X position with more randomness
                    height / 2 - 5, // Y position (half height to sit on ground)
                    zOffset + (Math.random() - 0.5) * 100 + distance // Z position with more randomness
                );
                
                mountainGroup.add(mountain);
            }
        }
    }
    
    scene.add(mountainGroup);
}

// Add mountains that partially block the road
function addRoadMountains() {
    // Add mountains at intervals along the road - less frequently now
    for (let i = 200; i < roadLength; i += 300) {
        // Alternate sides of the road
        const side = (i % 600 < 300) ? 1 : -1;
        
        // Create mountain geometry
        const height = 5 + Math.random() * 10;
        const radius = 3 + Math.random() * 5;
        
        const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
        const mountainMaterial = new THREE.MeshPhongMaterial({
            color: 0x708090, // Blue-gray
            flatShading: true
        });
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        
        // Get road curve at this position
        const segmentIndex = Math.floor(i / segmentLength);
        const roadX = segmentIndex < roadCurve.length ? roadCurve[segmentIndex] : 0;
        
        // Position the mountain less on the road
        // Side determines which side of the road the mountain is on
        const roadEdge = roadX + (side * roadWidth / 2);
        const inwardOffset = radius * 0.4; // Reduced how far the mountain extends onto the road
        
        mountain.position.set(
            roadEdge - (side * inwardOffset), // Position less on the road
            height / 2 - 0.5, // Y position (half height to sit on ground)
            i // Z position along the road
        );
        
        // Add collision data
        mountain.userData = {
            isObstacle: true,
            radius: radius * 0.7, // Slightly smaller collision radius than visual
            segmentIndex: segmentIndex,
            type: 'mountain'
        };
        
        scene.add(mountain);
        roadMountains.push(mountain);
        obstacles.push(mountain); // Add to obstacles for collision detection
    }
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

// Create flames for the car
function createCarFlames() {
    // Clear any existing flames
    flames.forEach(flame => {
        if (flame.parent) flame.parent.remove(flame);
    });
    flames = [];
    
    // Create flame particles
    const flameCount = 20;
    const flameColors = [0xff0000, 0xff5500, 0xff8800, 0xffaa00, 0xffff00];
    
    for (let i = 0; i < flameCount; i++) {
        const size = 0.2 + Math.random() * 0.4;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const colorIndex = Math.floor(Math.random() * flameColors.length);
        const material = new THREE.MeshBasicMaterial({
            color: flameColors[colorIndex],
            transparent: true,
            opacity: 0.8
        });
        
        const flame = new THREE.Mesh(geometry, material);
        
        // Position flames around the car
        flame.position.set(
            (Math.random() - 0.5) * 1.5,
            Math.random() * 0.5 + 0.5,
            (Math.random() - 0.5) * 2
        );
        
        // Add flame properties
        flame.userData = {
            originalY: flame.position.y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.05 + Math.random() * 0.05,
            amplitude: 0.1 + Math.random() * 0.2,
            growRate: 0.01 + Math.random() * 0.02,
            maxSize: size * (1.5 + Math.random()),
            originalSize: size
        };
        
        car.add(flame);
        flames.push(flame);
    }
}

// Update flames animation
function updateFlames(deltaTime) {
    flames.forEach(flame => {
        // Animate flame position (flickering)
        flame.userData.phase += flame.userData.speed * deltaTime;
        flame.position.y = flame.userData.originalY + 
                          Math.sin(flame.userData.phase) * flame.userData.amplitude;
        
        // Pulse size
        const sizeScale = 1 + 0.2 * Math.sin(flame.userData.phase * 2);
        flame.scale.set(sizeScale, sizeScale, sizeScale);
        
        // Random color changes for flickering effect
        if (Math.random() > 0.9) {
            const flameColors = [0xff0000, 0xff5500, 0xff8800, 0xffaa00, 0xffff00];
            const colorIndex = Math.floor(Math.random() * flameColors.length);
            flame.material.color.setHex(flameColors[colorIndex]);
        }
        
        // Grow flames over time if still growing
        if (flame.scale.x < flame.userData.maxSize) {
            const newScale = flame.scale.x + flame.userData.growRate * deltaTime;
            flame.scale.set(newScale, newScale, newScale);
        }
    });
}

// Generate a curved road
function generateRoad() {
    // Generate road curve points with more dramatic turns
    const frequency = 0.05;
    const baseAmplitude = 3;
    const dramaticTurnFrequency = 0.01; // Frequency of dramatic turns
    const dramaticTurnAmplitude = 8; // Amplitude of dramatic turns
    
    for (let i = 0; i < roadLength / segmentLength; i++) {
        // Create a combination of gentle curves and occasional dramatic turns
        const normalCurve = Math.sin(i * frequency) * baseAmplitude;
        const dramaticCurve = Math.sin(i * dramaticTurnFrequency) * dramaticTurnAmplitude;
        
        // Add some random variation to make turns less predictable
        const randomVariation = Math.sin(i * 0.2) * 1.5;
        
        // Combine all curve components
        const curveAmount = normalCurve + dramaticCurve + randomVariation;
        
        roadCurve.push(curveAmount);
    }
    
    // Create road segments
    const roadGroup = new THREE.Group();
    
    // Add road base (darker asphalt underneath)
    const roadBaseGeometry = new THREE.PlaneGeometry(roadWidth + 1, roadLength);
    const roadBaseMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a, // Dark asphalt
        side: THREE.DoubleSide
    });
    const roadBase = new THREE.Mesh(roadBaseGeometry, roadBaseMaterial);
    roadBase.rotation.x = -Math.PI / 2;
    roadBase.position.set(0, -0.05, roadLength / 2);
    roadGroup.add(roadBase);
    
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
        
        // Add road markings (white lines)
        if (i % 4 < 2) { // Create dashed center line
            const lineGeometry = new THREE.PlaneGeometry(0.2, segmentLength * 0.7);
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, z + segmentLength / 2); // Slightly above road
            roadGroup.add(line);
        }
        
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
        
        // Add occasional trees on both sides of the road
        if (i % 15 === 0 || i % 23 === 0) { // Use prime numbers for more natural spacing
            addTree(x - roadWidth / 2 - 5, z, roadGroup); // Left side tree
        }
        
        if (i % 17 === 0 || i % 19 === 0) { // Different spacing for right side
            addTree(x + roadWidth / 2 + 5, z, roadGroup); // Right side tree
        }
        
        // Add occasional obstacles on the road
        if (i % 50 === 0 && i > 20) { // Start obstacles after some distance
            addObstacle(x, z, roadGroup, i);
        }
    }
    
    scene.add(roadGroup);
    road = roadGroup;
    
    // Add mountains that partially block the road
    addRoadMountains();
}

// Create a tree
function addTree(x, z, parent) {
    // Randomly choose tree type (pine or regular)
    const treeType = Math.random() > 0.5 ? 'pine' : 'regular';
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1, z);
    
    // Tree top (foliage)
    let foliage;
    
    if (treeType === 'pine') {
        // Pine tree (multiple cone layers)
        foliage = new THREE.Group();
        
        const coneCount = 3;
        const coneHeight = 1.2;
        const baseRadius = 1.5;
        
        for (let i = 0; i < coneCount; i++) {
            const coneGeometry = new THREE.ConeGeometry(
                baseRadius * (1 - i * 0.2), 
                coneHeight, 
                8
            );
            const coneMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x006400, // Dark green
                flatShading: true
            });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.y = 1.5 + i * 0.8;
            foliage.add(cone);
        }
    } else {
        // Regular tree (single bulbous foliage)
        const foliageGeometry = Math.random() > 0.5 ? 
            new THREE.SphereGeometry(1.5, 8, 8) : // Round foliage
            new THREE.ConeGeometry(1.5, 3, 8);    // Conical foliage
            
        const foliageMaterial = new THREE.MeshPhongMaterial({ 
            color: Math.random() > 0.8 ? 0x228B22 : 0x32CD32, // Vary the green color
            flatShading: true
        });
        
        foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 2;
    }
    
    // Create tree group
    const tree = new THREE.Group();
    tree.add(trunk);
    trunk.add(foliage);
    
    // Add some random rotation and scale variation
    tree.rotation.y = Math.random() * Math.PI * 2;
    const scale = 0.8 + Math.random() * 0.6; // More size variation
    tree.scale.set(scale, scale, scale);
    
    // Add some random offset from the exact roadside
    const offsetX = (Math.random() - 0.5) * 3;
    const offsetZ = (Math.random() - 0.5) * 5;
    tree.position.x += offsetX;
    tree.position.z += offsetZ;
    
    parent.add(tree);
    trees.push(tree);
    
    return tree;
}

// Create an obstacle (rock) on the road
function addObstacle(x, z, parent, segmentIndex) {
    // Random position across the road width
    const offsetX = (Math.random() - 0.5) * (roadWidth - 2);
    
    // Create rock geometry
    const rockGeometry = new THREE.DodecahedronGeometry(0.8, 1);
    const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080, // Gray
        flatShading: true
    });
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // Position the rock
    rock.position.set(x + offsetX, 0.4, z);
    rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    // Add collision data
    rock.userData = {
        isObstacle: true,
        radius: 0.8,
        segmentIndex: segmentIndex
    };
    
    parent.add(rock);
    obstacles.push(rock);
    
    return rock;
}

// Create explosion effect
function createExplosion(position, isMountainCrash = false) {
    // More particles for mountain crashes
    const particleCount = isMountainCrash ? 100 : 50;
    const explosionGroup = new THREE.Group();
    
    // Add a flash of light
    const flashGeometry = new THREE.SphereGeometry(isMountainCrash ? 5 : 3, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    flash.userData = { type: 'flash', lifetime: 300 };
    scene.add(flash);
    explosionParticles.push(flash);
    
    // Add smoke cloud for mountain crashes
    if (isMountainCrash) {
        const smokeCount = 15;
        for (let i = 0; i < smokeCount; i++) {
            const smokeSize = 1 + Math.random() * 3;
            const smokeGeometry = new THREE.SphereGeometry(smokeSize, 8, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.7
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            
            // Position around crash site
            smoke.position.set(
                position.x + (Math.random() - 0.5) * 8,
                position.y + Math.random() * 5,
                position.z + (Math.random() - 0.5) * 8
            );
            
            // Set random velocity (slower than debris)
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                Math.random() * 0.05,
                (Math.random() - 0.5) * 0.05
            );
            
            smoke.userData = { 
                velocity,
                type: 'smoke',
                expandRate: 0.01 + Math.random() * 0.02
            };
            
            scene.add(smoke);
            explosionParticles.push(smoke);
        }
    }
    
    // Create debris particles
    for (let i = 0; i < particleCount; i++) {
        // Create particle geometry
        const size = 0.1 + Math.random() * (isMountainCrash ? 0.3 : 0.2);
        const geometry = new THREE.BoxGeometry(size, size, size);
        
        // Random colors for explosion
        const colors = isMountainCrash ? 
            [0xff0000, 0xff5500, 0xffaa00, 0xffff00, 0xaaaaaa] : // Add some gray for rocks
            [0xff0000, 0xff5500, 0xffaa00, 0xffff00];
            
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            emissive: 0xff0000,
            transparent: true,
            opacity: 1.0
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Set random velocity - faster for mountain crashes
        const speedMultiplier = isMountainCrash ? 1.5 : 1.0;
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2 * speedMultiplier,
            Math.random() * 0.2 * speedMultiplier,
            (Math.random() - 0.5) * 0.2 * speedMultiplier
        );
        
        particle.userData = { 
            velocity,
            type: 'debris'
        };
        
        // Position around car
        particle.position.set(
            position.x + (Math.random() - 0.5) * 2,
            position.y + (Math.random() - 0.5) * 2,
            position.z + (Math.random() - 0.5) * 2
        );
        
        explosionGroup.add(particle);
        explosionParticles.push(particle);
    }
    
    scene.add(explosionGroup);
    return explosionGroup;
}

// Update explosion particles
function updateExplosion(deltaTime) {
    for (let i = 0; i < explosionParticles.length; i++) {
        const particle = explosionParticles[i];
        
        if (particle.userData.type === 'flash') {
            // Update flash lifetime
            particle.userData.lifetime -= deltaTime;
            if (particle.userData.lifetime <= 0) {
                scene.remove(particle);
                continue;
            }
            // Shrink flash
            const scale = particle.userData.lifetime / 300;
            particle.scale.set(scale, scale, scale);
            particle.material.opacity = scale * 0.8;
            continue;
        }
        
        if (particle.userData.type === 'smoke') {
            // Expand smoke
            particle.scale.x += particle.userData.expandRate * deltaTime;
            particle.scale.y += particle.userData.expandRate * deltaTime;
            particle.scale.z += particle.userData.expandRate * deltaTime;
            
            // Fade out smoke
            if (particle.material.opacity > 0) {
                particle.material.opacity -= 0.002 * deltaTime;
            }
        }
        
        const velocity = particle.userData.velocity;
        
        // Apply gravity
        velocity.y -= 0.01 * deltaTime;
        
        // Update position
        particle.position.x += velocity.x * deltaTime;
        particle.position.y += velocity.y * deltaTime;
        particle.position.z += velocity.z * deltaTime;
        
        // Rotate particle
        particle.rotation.x += 0.02 * deltaTime;
        particle.rotation.y += 0.02 * deltaTime;
        
        // Fade out debris
        if (particle.userData.type === 'debris' && particle.material.opacity > 0) {
            particle.material.opacity -= 0.01 * deltaTime;
        }
    }
    
    // Remove faded particles
    explosionParticles = explosionParticles.filter(p => {
        if (p.material.opacity <= 0 || p.userData.lifetime <= 0) {
            scene.remove(p);
            return false;
        }
        return true;
    });
}

// Set up event listeners
function setupEventListeners() {
    // Start button
    document.getElementById('start-button').addEventListener('click', startGame);
    
    // Stop button
    document.getElementById('stop-button').addEventListener('click', stopGame);
    
    // Restart button
    document.getElementById('restart-button').addEventListener('click', resetGame);
    
    // Debug button
    document.getElementById('toggle-debug').addEventListener('click', toggleDebug);
    
    // Device orientation for steering
    window.addEventListener('deviceorientation', handleOrientation);
    
    // Screen orientation change
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Toggle debug mode
function toggleDebug() {
    debugMode = !debugMode;
    const debugInfo = document.getElementById('debug-info');
    debugInfo.style.display = debugMode ? 'block' : 'none';
}

// Update debug info
function updateDebugInfo() {
    if (!debugMode) return;
    
    const debugInfo = document.getElementById('debug-info');
    debugInfo.innerHTML = `
        <div>Screen Orientation: ${screenOrientation}°</div>
        <div>Alpha: ${deviceOrientation.alpha.toFixed(2)}°</div>
        <div>Beta: ${deviceOrientation.beta.toFixed(2)}°</div>
        <div>Gamma: ${deviceOrientation.gamma.toFixed(2)}°</div>
        <div>Car Position: ${carPosition.toFixed(2)}</div>
        <div>Steer Input: ${steerValue.toFixed(2)}</div>
    `;
}

// Handle screen orientation changes
function handleOrientationChange() {
    screenOrientation = window.orientation || 0;
    console.log('Screen orientation changed to:', screenOrientation);
}

// Handle device orientation for steering
function handleOrientation(event) {
    if (!event.gamma || !event.beta || !event.alpha) return;
    
    // Update device orientation data
    deviceOrientation.gamma = event.gamma; // Left/right tilt
    deviceOrientation.beta = event.beta;   // Front/back tilt
    deviceOrientation.alpha = event.alpha; // Compass direction
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
        if (!gameOver) {
            updateGame(deltaTime);
            checkCollisions();
        } else {
            // Update explosion when game over
            explosionTime += deltaTime;
            updateExplosion(deltaTime);
            
            // Update flames on the car
            updateFlames(deltaTime);
            
            // Slow down the car gradually
            if (carSpeed > 0) {
                carSpeed = Math.max(0, carSpeed - 0.0001 * deltaTime);
                carDistance += carSpeed * deltaTime;
                
                // Update car position during slowdown
                const currentSegment = Math.floor(carDistance / segmentLength) % (roadLength / segmentLength);
                const targetX = roadCurve[currentSegment];
                car.position.z = carDistance % roadLength;
                car.position.x = targetX + carPosition;
                
                // Update camera to follow car during slowdown
                camera.position.x = car.position.x;
                camera.position.z = car.position.z - 5;
                camera.lookAt(car.position.x, car.position.y + 1, car.position.z + 10);
            }
        }
    }
    
    updateDebugInfo();
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
    
    // Determine which orientation value to use based on screen orientation
    let steerInput = 0;
    
    // Different handling based on screen orientation
    if (Math.abs(screenOrientation) === 90) {
        // Landscape mode
        // For landscape left (screenOrientation = -90), beta tilting forward = car right
        // For landscape right (screenOrientation = 90), beta tilting forward = car left
        const multiplier = screenOrientation === 90 ? -1 : 1;
        steerInput = multiplier * Math.max(-30, Math.min(30, deviceOrientation.beta)) / 30;
    } else {
        // Portrait mode - use gamma (tilting left/right)
        steerInput = Math.max(-30, Math.min(30, deviceOrientation.gamma)) / 30;
    }
    
    // Store for debug display
    steerValue = steerInput;
    
    // Apply steering with increased sensitivity for better control
    carPosition += steerInput * 0.08 * deltaTime;
    
    // Limit car position to road width
    carPosition = Math.max(-roadWidth/2 + 1, Math.min(roadWidth/2 - 1, carPosition));
    
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

// Check for collisions
function checkCollisions() {
    if (gameOver) return;
    
    const carRadius = 1; // Approximate car collision radius
    
    // Check collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        
        // Only check obstacles in the current segment
        const obstacleSegment = obstacle.userData.segmentIndex;
        const currentSegment = Math.floor(carDistance / segmentLength) % (roadLength / segmentLength);
        
        // For regular obstacles, only check nearby ones
        // For mountains, check with a wider range since they're larger
        const checkRange = obstacle.userData.type === 'mountain' ? 10 : 5;
        
        if (Math.abs(obstacleSegment - currentSegment) > checkRange) continue;
        
        const dx = car.position.x - obstacle.position.x;
        const dz = car.position.z - obstacle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < carRadius + obstacle.userData.radius) {
            // Collision detected!
            handleCollision(obstacle.userData.type);
            break;
        }
    }
}

// Handle collision
function handleCollision(obstacleType) {
    if (gameOver) return;
    
    gameOver = true;
    explosionTime = 0;
    
    // Create explosion at car position
    const isMountainCrash = (obstacleType === 'mountain');
    createExplosion(car.position.clone(), isMountainCrash);
    
    // Add flames to the car instead of hiding it
    createCarFlames();
    
    // Gradually slow down the car
    carSpeed = speed;
    
    // Hide game over message - we're not using it anymore
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'none';
    
    // Hide control buttons
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'none';
    
    // Show restart button after a delay
    setTimeout(() => {
        document.getElementById('restart-button').style.display = 'block';
    }, 3000);
}

// Reset game after collision
function resetGame() {
    gameOver = false;
    carDistance = 0;
    carPosition = 0;
    carSpeed = 0;
    
    // Remove flames
    flames.forEach(flame => {
        if (flame.parent) flame.parent.remove(flame);
    });
    flames = [];
    
    // Reset car position
    car.position.set(0, 0, 0);
    
    // Clear explosion particles
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        scene.remove(particle);
    }
    explosionParticles = [];
    
    // Hide restart button
    document.getElementById('restart-button').style.display = 'none';
    
    // Show start button
    document.getElementById('start-button').style.display = 'block';
    document.getElementById('stop-button').style.display = 'none';
    
    // Reset camera position
    camera.position.set(0, 2, 0);
    camera.lookAt(0, 1, 10);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 