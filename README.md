# Race Car Game

A web-based race car game with gyroscope steering, designed for iPhone.

## Features

- Colorful 3D environment with procedurally generated road
- Gyroscope-based steering (tilt your phone to steer)
- Mountains and trees for an immersive environment
- Dramatic road turns for challenging gameplay
- Obstacle avoidance gameplay
- Car explosion effects with flames and particles
- Sound effects for engine and crashes
- Restart-in-place functionality after crashes

## Controls

- **Go!** - Start the game
- **Stop** - Pause the game
- **Try Again** - Continue from where you crashed
- **Debug** - Show debug information
- **🔊/🔇** - Toggle sound on/off

## How to Play

1. Open the game on your iPhone
2. Press "Go!" to start driving
3. Tilt your phone to steer the car
4. Avoid obstacles and mountains on the road
5. If you crash, press "Try Again" to continue from that point

## Running the Game

### Local Development

1. Clone this repository
2. Open the project folder
3. Start a local web server (you can use Python's built-in server):
   ```
   python -m http.server
   ```
4. Open your browser and navigate to `http://localhost:8000`

### Deployment

For the best experience on mobile devices, deploy to a web server with HTTPS support, as device orientation API requires a secure context.

You can use services like:
- GitHub Pages
- Netlify
- Vercel

## Technical Details

The game is built using:
- HTML5
- CSS3
- JavaScript
- Three.js for 3D graphics

## Device Compatibility

- Works best on modern mobile browsers
- Requires device orientation support
- For iOS 13+, the game will request permission to use the gyroscope 

### Development

To run locally:

```
npx serve
```

To deploy to Vercel:

```
vercel --prod
```

### Credits

- Sound effects:
  - Engine sound: "Car Changing Gears Sound" 
  - Crash sound: "Car Accident with Squeal and Crash"
- Built with Three.js 