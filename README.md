# Race Car Game

A web-based racing game that uses device gyroscope for steering control, designed to work on mobile devices including iPhone.

## Features

- 3D racing experience with a curved road that changes direction
- Gyroscope-based steering (tilt your phone left/right)
- Simple controls with "Go!" and "Stop!" buttons
- Colorful UI with a red car and green/gray environment
- Infinite procedurally generated road

## How to Play

1. Open the game in a mobile browser (Safari on iPhone works best)
2. Hold your phone in landscape orientation
3. Press the green "Go!" button to start driving
4. Tilt your phone left and right to steer the car
5. Press the red "Stop!" button to stop driving

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