# VR Race Car Game

A WebXR-compatible racing game that works on desktop, mobile, and VR headsets like Meta Quest 2.

## Features

- Responsive design works on desktop, mobile, and VR
- WebXR support for immersive VR experience
- Virtual steering wheel for realistic driving in VR
- Intuitive controls for each platform
- Obstacle avoidance gameplay
- Distance tracking and scoring

## Playing in VR on Meta Quest 2

1. Open the game URL in the Meta Quest browser
2. Click the "Enter VR" button or use the WebXR button that appears
3. Use the controllers:
   - Grab the steering wheel with both hands using the grip buttons (squeeze the side buttons)
   - Rotate the wheel to steer left and right
   - Pull the trigger on either controller to accelerate
   - Release the trigger to slow down

## Desktop Controls

- Arrow keys or WASD to steer
- Click "Go!" button to start

## Mobile Controls

- Tilt your device left/right to steer
- Touch "Go!" button to start

## Development

This game uses:
- Three.js for 3D rendering
- WebXR API for VR support
- Standard HTML/CSS/JavaScript

## VR Optimization Tips

- Keep the game running at 72fps+ for comfortable VR experience
- Reduce polygon count for better performance
- Use spatial audio for immersion
- Implement comfort settings to reduce motion sickness

## Deployment

The game can be deployed to any static web hosting service.

```
npm install
npm run build
```

## License

MIT 