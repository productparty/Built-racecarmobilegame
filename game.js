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
let lastCarPosition = { x: 0, z: 0 }; // Store last position before crash
let distanceDriven = 0;  // Total distance in meters
let lastSpeedIncrease = 0;  // Time tracker for speed increases
let baseSpeed = 0.05;    // Initial speed
let speedMultiplier = 1; // Speed multiplier
let speedIncreaseAmount = 0.2; // Increased from 0.1 to 0.2 for more noticeable speed changes

// Sound effects
let engineSound, explosionSound;
let soundEnabled = true;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Create camera with adjusted position and FOV
    camera = new THREE.PerspectiveCamera(
        60, // Reduced FOV from 75 to 60 for better visibility
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    // Position camera higher and further back
    camera.position.set(0, 5, -5); // Changed from (0, 2, 0)
    camera.lookAt(0, 0, 10);
    
    // Create renderer with explicit canvas
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ 
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased intensity
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add a helper grid for debugging
    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);
    
    // Initialize game elements
    createCar();
    generateRoad();
    createMountains();
    
    // Start animation loop
    animate(0);
    
    // Log debug info
    console.log('Scene initialized:', {
        cameraPosition: camera.position,
        sceneChildren: scene.children.length,
        rendererInfo: renderer.info
    });
}

// Load sound effects
function loadSounds() {
    // Get audio elements
    engineSound = document.getElementById('engine-sound');
    explosionSound = document.getElementById('explosion-sound');
    
    // Set initial volumes
    engineSound.volume = 0.4;
    explosionSound.volume = 0.7;
}

// Play engine sound
function playEngineSound() {
    if (!soundEnabled) return;
    
    // Only play if not already playing
    if (engineSound.paused) {
        engineSound.currentTime = 0;
        engineSound.play().catch(error => {
            console.log("Audio play failed:", error);
            // On mobile, we need user interaction to play audio
            // We'll try again when the user interacts with the game
        });
    }
}

// Stop engine sound
function stopEngineSound() {
    if (engineSound) {
        engineSound.pause();
        engineSound.currentTime = 0; // Reset the sound to beginning
    }
}

// Play explosion sound
function playExplosionSound() {
    if (!soundEnabled) return;
    
    // Make sure the sound is loaded and ready
    if (explosionSound) {
        explosionSound.currentTime = 0;
        explosionSound.volume = 1.0;  // Increased volume from 0.7 to 1.0
        
        // Force play the explosion sound
        const promise = explosionSound.play();
        
        if (promise !== undefined) {
            promise.catch(error => {
                console.log("Failed to play explosion sound:", error);
                
                // Fallback: Create and play a new Audio instance for more reliable playback
                const crashSound = new Audio('sounds/car-accident-with-squeal-and-crash-6054.mp3');
                crashSound.volume = 1.0;
                crashSound.play().catch(err => {
                    console.log("Fallback audio also failed:", err);
                });
            });
        }
    }
}

// Create distant mountains for scenery
function createMountains() {
    const mountainGroup = new THREE.Group();
    
    // Create several mountain ranges at different distances and along the road
    for (let range = 0; range < 3; range++) {
        const distance = 100 + range * 50; // Distance from road
        const rangeWidth = 800; // Width of mountain range
        const mountainCount = 25 + range * 5;
        
        for (let roadSection = 0; roadSection < 3; roadSection++) {
            const zOffset = roadSection * (roadLength / 3);
            
            for (let i = 0; i < mountainCount; i++) {
                const position = (i / mountainCount) * rangeWidth - rangeWidth / 2;
                
                // Calculate minimum distance from road center
                const minDistanceFromRoad = (roadWidth / 2) + 20; // Road width plus buffer
                
                // Ensure mountain is placed away from road
                let xPosition = position + (Math.random() - 0.5) * 60;
                if (Math.abs(xPosition) < minDistanceFromRoad) {
                    // If too close to road, push it outside
                    xPosition = (xPosition > 0) ? 
                        minDistanceFromRoad + Math.random() * 20 : 
                        -minDistanceFromRoad - Math.random() * 20;
                }
                
                const height = 20 + Math.random() * 30;
                const radius = 10 + Math.random() * 20;
                
                const mountainGeometry = new THREE.ConeGeometry(radius, height, 8);
                const mountainMaterial = new THREE.MeshPhongMaterial({
                    color: range === 0 ? 0x4682B4 : (range === 1 ? 0x708090 : 0x778899),
                    flatShading: true
                });
                
                const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
                mountain.position.set(
                    xPosition,
                    height / 2 - 5,
                    zOffset + (Math.random() - 0.5) * 100 + distance
                );
                
                mountainGroup.add(mountain);
            }
        }
    }
    
    scene.add(mountainGroup);
}

// Create the car model
function createCar() {
    const carBody = new THREE.Group();
    
    // Main body - made larger and brighter red
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4); // Increased size
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0x330000, // Add slight emission
        shininess: 30
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1; // Raised position
    carBody.add(body);
    
    // Add car to scene
    scene.add(carBody);
    car = carBody;
    
    // Position car at starting point
    car.position.set(0, 0, 0);
    
    console.log('Car created:', car.position);
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
    const roadManager = new RoadManager();
    const textureLoader = new THREE.TextureLoader();
    
    // Create texture atlas
    const roadTextureAtlas = textureLoader.load('road_atlas.png');
    roadTextureAtlas.minFilter = THREE.NearestMilinearFilter;
    roadTextureAtlas.magFilter = THREE.LinearFilter;
    
    // Create optimized materials
    const roadMaterial = new THREE.MeshStandardMaterial({
        map: roadTextureAtlas,
        roughnessMap: textureLoader.load('road_roughness.png'),
        metalnessMap: textureLoader.load('road_metalness.png'),
        side: THREE.FrontSide, // Only render front face for performance
    });

    // Create instanced mesh for repeating elements
    const markingGeometry = new THREE.PlaneGeometry(0.2, 5);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markingInstance = new THREE.InstancedMesh(
        markingGeometry,
        markingMaterial,
        Math.floor(roadLength / 10)
    );

    // Set up road segments with instancing
    const segmentCount = roadLength / segmentLength;
    const matrix = new THREE.Matrix4();
    
    for (let i = 0; i < segmentCount; i++) {
        const z = i * segmentLength;
        const x = roadCurve[i];

        // Position road segment
        matrix.makeTranslation(x, 0, z + segmentLength / 2);
        matrix.makeRotationX(-Math.PI / 2);
        markingInstance.setMatrixAt(i, matrix);

        // Create road segment with LOD
        const segment = new THREE.Mesh(
            roadManager.createRoadGeometry(1, 1),
            roadMaterial
        );
        segment.position.set(x, 0, z + segmentLength / 2);
        segment.rotation.x = -Math.PI / 2;
        
        roadManager.segments.push(segment);
        scene.add(segment);
    }

    scene.add(markingInstance);
    
    // Add update to render loop
    return roadManager;
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
function createExplosion(position, isPotholeCrash = false) {
    // More particles for pothole crashes
    const particleCount = isPotholeCrash ? 100 : 50;
    const explosionGroup = new THREE.Group();
    
    // Add a flash of light
    const flashGeometry = new THREE.SphereGeometry(isPotholeCrash ? 3 : 2, 16, 16);
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
    
    // Add smoke and debris for pothole crashes
    if (isPotholeCrash) {
        const smokeCount = 15;
        for (let i = 0; i < smokeCount; i++) {
            const smokeSize = 0.5 + Math.random() * 1.5;
            const smokeGeometry = new THREE.SphereGeometry(smokeSize, 8, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.7
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            
            // Position around crash site
            smoke.position.set(
                position.x + (Math.random() - 0.5) * 5,
                position.y + Math.random() * 3,
                position.z + (Math.random() - 0.5) * 5
            );
            
            // Add velocity for animation
            smoke.userData = {
                type: 'smoke',
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05,
                    0.05 + Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.05
                ),
                lifetime: 1000 + Math.random() * 2000
            };
            
            scene.add(smoke);
            explosionParticles.push(smoke);
        }
        
        // Add some road debris (pieces of asphalt)
        const debrisCount = 20;
        for (let i = 0; i < debrisCount; i++) {
            const debrisSize = 0.1 + Math.random() * 0.2;
            const debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
            const debrisMaterial = new THREE.MeshBasicMaterial({
                color: 0x333333 // Asphalt color
            });
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            // Position at crash site
            debris.position.copy(position);
            
            // Add velocity for animation
            const speed = 0.1 + Math.random() * 0.2;
            const angle = Math.random() * Math.PI * 2;
            debris.userData = {
                type: 'debris',
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    0.1 + Math.random() * 0.2,
                    Math.sin(angle) * speed
                ),
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.2,
                    Math.random() * 0.2,
                    Math.random() * 0.2
                ),
                lifetime: 1000 + Math.random() * 1000
            };
            
            scene.add(debris);
            explosionParticles.push(debris);
        }
    }
    
    // Add explosion particles
    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.3 ? 0xff5500 : 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Position at explosion center
        particle.position.copy(position);
        
        // Add velocity for animation
        const speed = 0.05 + Math.random() * 0.1;
        const angle = Math.random() * Math.PI * 2;
        const elevation = Math.random() * Math.PI - Math.PI / 2;
        
        particle.userData = {
            type: 'particle',
            velocity: new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed,
                Math.sin(angle) * Math.cos(elevation) * speed
            ),
            lifetime: 500 + Math.random() * 1000
        };
        
        scene.add(particle);
        explosionParticles.push(particle);
    }
}

// Update explosion particles
function updateExplosion(deltaTime) {
    // Update each particle
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        
        // Skip if particle has been removed
        if (!particle.parent) {
            explosionParticles.splice(i, 1);
            continue;
        }
        
        // Update based on particle type
        if (particle.userData.type === 'flash') {
            // Flash fades quickly
            particle.material.opacity -= deltaTime * 0.005;
            particle.scale.multiplyScalar(1 + deltaTime * 0.001);
            
            if (particle.material.opacity <= 0) {
                scene.remove(particle);
                explosionParticles.splice(i, 1);
            }
        } 
        else if (particle.userData.type === 'smoke') {
            // Smoke rises and expands
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            particle.scale.multiplyScalar(1 + deltaTime * 0.0005);
            particle.material.opacity -= deltaTime * 0.0003;
            
            // Update lifetime
            particle.userData.lifetime -= deltaTime;
            if (particle.userData.lifetime <= 0 || particle.material.opacity <= 0) {
                scene.remove(particle);
                explosionParticles.splice(i, 1);
            }
        }
        else if (particle.userData.type === 'debris') {
            // Debris follows physics (gravity)
            particle.userData.velocity.y -= 0.0003 * deltaTime; // Gravity
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Rotate debris
            particle.rotation.x += particle.userData.rotationSpeed.x * deltaTime;
            particle.rotation.y += particle.userData.rotationSpeed.y * deltaTime;
            particle.rotation.z += particle.userData.rotationSpeed.z * deltaTime;
            
            // Update lifetime
            particle.userData.lifetime -= deltaTime;
            if (particle.userData.lifetime <= 0 || particle.position.y < -5) {
                scene.remove(particle);
                explosionParticles.splice(i, 1);
            }
        }
        else if (particle.userData.type === 'particle') {
            // Explosion particles follow physics
            particle.userData.velocity.y -= 0.0002 * deltaTime; // Gravity
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            particle.material.opacity -= deltaTime * 0.001;
            
            // Update lifetime
            particle.userData.lifetime -= deltaTime;
            if (particle.userData.lifetime <= 0 || particle.material.opacity <= 0) {
                scene.remove(particle);
                explosionParticles.splice(i, 1);
            }
        }
        else {
            // Legacy particles (for backward compatibility)
            if (particle.userData.velocity) {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
                particle.userData.velocity.y -= 0.0002 * deltaTime; // Gravity
            }
            
            // Fade out
            if (particle.material.opacity) {
                particle.material.opacity -= deltaTime * 0.001;
                
                if (particle.material.opacity <= 0) {
                    if (particle.parent === scene) {
                        scene.remove(particle);
                    } else if (particle.parent) {
                        particle.parent.remove(particle);
                    }
                    explosionParticles.splice(i, 1);
                }
            }
        }
    }
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
    
    // Sound toggle button
    document.getElementById('toggle-sound').addEventListener('click', toggleSound);
    
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
    
    if (debugMode) {
        debugInfo.classList.add('debug-visible');
    } else {
        debugInfo.classList.remove('debug-visible');
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundButton = document.getElementById('toggle-sound');
    
    if (soundEnabled) {
        soundButton.textContent = '🔊';
        if (isPlaying && !gameOver) {
            playEngineSound();
        }
    } else {
        soundButton.textContent = '🔇';
        stopEngineSound();
        explosionSound.pause();
    }
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
    gameOver = false; // Ensure game over state is reset
    document.getElementById('start-button').classList.add('hidden');
    document.getElementById('stop-button').classList.remove('hidden');
    
    // Play engine sound
    playEngineSound();
    
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
    document.getElementById('start-button').classList.remove('hidden');
    document.getElementById('stop-button').classList.add('hidden');
    
    // Stop engine sound
    stopEngineSound();
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
    
    // Ensure renderer is valid
    if (!renderer) {
        console.error('Renderer not initialized');
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // Always render, even if not playing
    renderer.render(scene, camera);
    
    if (isPlaying && !gameOver) {
        updateGame(deltaTime);
        checkCollisions();
    }
    
    // Debug output
    if (debugMode) {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.innerHTML = `
                <div>Camera: ${JSON.stringify(camera.position)}</div>
                <div>Car: ${JSON.stringify(car.position)}</div>
                <div>FPS: ${Math.round(1000 / deltaTime)}</div>
            `;
        }
    }
}

// Update game state
function updateGame(deltaTime) {
    // Update physics world
    physicsWorld.stepSimulation(deltaTime / 1000, 10);
    
    // Update car position from physics
    const transform = new Ammo.btTransform();
    const motionState = carBody.getMotionState();
    motionState.getWorldTransform(transform);
    
    const pos = transform.getOrigin();
    const rot = transform.getRotation();
    
    car.position.set(pos.x(), pos.y(), pos.z());
    car.quaternion.set(rot.x(), rot.y(), rot.z(), rot.w());
    
    // Update obstacles
    obstacles.forEach(obstacle => {
        if (obstacle.userData.physicsBody) {
            const motionState = obstacle.userData.physicsBody.getMotionState();
            motionState.getWorldTransform(transform);
            const pos = transform.getOrigin();
            obstacle.position.set(pos.x(), pos.y(), pos.z());
        }
    });
    
    // Update distance driven (convert meters to miles)
    const metersPerUnit = 5; // Conversion factor for game units to meters
    distanceDriven += (speed * deltaTime * metersPerUnit);
    
    // Convert meters to miles (1 mile = 1609.34 meters)
    const milesDriver = distanceDriven / 1609.34;
    
    // Update distance counter display
    const distanceCounter = document.getElementById('distance-counter');
    if (distanceCounter) {
        distanceCounter.innerHTML = `Distance: ${milesDriver.toFixed(1)} mi`;
    }
    
    // Check if it's time to increase speed (every 5 seconds)
    lastSpeedIncrease += deltaTime;
    if (lastSpeedIncrease >= 5000) { // 5000ms = 5 seconds
        speedMultiplier += speedIncreaseAmount; // Use the new variable for speed increase
        speed = baseSpeed * speedMultiplier;
        lastSpeedIncrease = 0; // Reset timer
        
        // Optional: Show speed increase notification
        showSpeedIncreaseNotification();
    }
    
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
    
    // Store last position for restart-in-place
    lastCarPosition.x = car.position.x;
    lastCarPosition.z = car.position.z;
    
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
        
        // Check nearby obstacles
        const checkRange = 5;
        
        if (Math.abs(obstacleSegment - currentSegment) > checkRange) continue;
        
        const dx = car.position.x - obstacle.position.x;
        const dz = car.position.z - obstacle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < carRadius + obstacle.userData.radius) {
            // Collision detected!
            handleCollision(obstacle.userData.type || 'obstacle');
            break;
        }
    }
}

// Handle collision
function handleCollision(obstacleType) {
    if (gameOver) return;
    
    gameOver = true;
    explosionTime = 0;
    carSpeed = speed; // Store current speed for deceleration
    
    // Stop engine sound first
    stopEngineSound();
    
    // Play explosion sound immediately with no delay
    playExplosionSound();
    
    // Create explosion at car position immediately
    const isPotholeCrash = (obstacleType === 'pothole');
    createExplosion(car.position.clone(), isPotholeCrash);
    
    // Create flames immediately
    createCarFlames();
    
    // Show final distance in miles
    const finalMiles = (distanceDriven / 1609.34).toFixed(1);
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
        gameOverElement.classList.add('visible');
        gameOverElement.innerHTML = `Game Over!<br>Distance: ${finalMiles} mi`;
    }
    
    // Hide control buttons
    document.getElementById('start-button').classList.add('hidden');
    document.getElementById('stop-button').classList.add('hidden');
    
    // Show restart button after a delay
    setTimeout(() => {
        document.getElementById('restart-button').classList.add('visible');
    }, 3000);
}

// Reset game after collision
function resetGame() {
    gameOver = false;
    carSpeed = 0;
    
    // Remove flames
    flames.forEach(flame => {
        if (flame.parent) flame.parent.remove(flame);
    });
    flames = [];
    
    // Clear explosion particles
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        scene.remove(particle);
    }
    explosionParticles = [];
    
    // Hide game over and restart button
    document.getElementById('game-over').classList.remove('visible');
    document.getElementById('restart-button').classList.remove('visible');
    
    // Show stop button
    document.getElementById('stop-button').classList.remove('hidden');
    
    // Restart engine sound
    playEngineSound();
    
    // Resume game
    isPlaying = true;
    
    // Reset speed and distance
    distanceDriven = 0;
    speedMultiplier = 1;
    speed = baseSpeed;
    lastSpeedIncrease = 0;
}

// Create potholes on the road
function addPotholes() {
    // Add potholes at random intervals along the road (more frequently)
    for (let i = 200; i < roadLength; i += 30 + Math.floor(Math.random() * 50)) {
        // Random position across the road width (but not too close to the edge)
        const segmentIndex = Math.floor(i / segmentLength);
        const roadX = segmentIndex < roadCurve.length ? roadCurve[segmentIndex] : 0;
        const offsetX = (Math.random() - 0.5) * (roadWidth - 2);
        
        // Create pothole geometry
        const radius = 0.6 + Math.random() * 0.6; // Slightly larger potholes
        const potholeGeometry = new THREE.CircleGeometry(radius, 12);
        const potholeMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000, // Darker color for better contrast
            side: THREE.DoubleSide,
            shininess: 0 // No shine for pothole
        });
        
        const pothole = new THREE.Mesh(potholeGeometry, potholeMaterial);
        
        // Rotate to lie flat on the road
        pothole.rotation.x = -Math.PI / 2;
        
        // Position the pothole
        pothole.position.set(
            roadX + offsetX,
            0.03, // Higher above road to avoid z-fighting
            i
        );
        
        // Add a more visible rim around the pothole
        const rimGeometry = new THREE.RingGeometry(radius, radius + 0.15, 12);
        const rimMaterial = new THREE.MeshBasicMaterial({
            color: 0x555555, // Lighter color for better contrast
            side: THREE.DoubleSide
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = -Math.PI / 2;
        rim.position.y = 0.025; // Slightly above the pothole
        pothole.add(rim);
        
        // Add a second inner rim for better visibility
        const innerRimGeometry = new THREE.RingGeometry(radius * 0.7, radius * 0.8, 12);
        const innerRimMaterial = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        const innerRim = new THREE.Mesh(innerRimGeometry, innerRimMaterial);
        innerRim.rotation.x = -Math.PI / 2;
        innerRim.position.y = 0.026; // Slightly above the outer rim
        pothole.add(innerRim);
        
        // Add collision data
        pothole.userData = {
            isObstacle: true,
            radius: radius * 0.9, // Slightly smaller collision radius than visual
            segmentIndex: segmentIndex,
            type: 'pothole'
        };
        
        scene.add(pothole);
        obstacles.push(pothole); // Add to obstacles for collision detection
    }
}

// Add a function to show speed increase notification
function showSpeedIncreaseNotification() {
    const notification = document.createElement('div');
    notification.className = 'speed-notification';
    notification.textContent = `Speed Increased to ${speedMultiplier.toFixed(1)}x!`;
    document.body.appendChild(notification);
    
    // Remove notification after animation
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 1000);
}

// Initialize the game when the page loads
window.addEventListener('load', init);
