# Deploying to Vercel

## Option 1: Using Vercel CLI (Fastest)

1. Install Vercel CLI:
```
npm install -g vercel
```

2. Run from your project directory:
```
vercel
```

3. Follow the prompts to deploy.

4. Your game will be available at the URL provided by Vercel.

## Option 2: Using GitHub and Vercel Dashboard

1. Create a GitHub repository and push your code:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/race-car-game.git
git push -u origin main
```

2. Go to [Vercel.com](https://vercel.com) and sign up/login

3. Click "New Project" and import your GitHub repository

4. Keep the default settings and click "Deploy"

5. Your game will be available at the URL provided by Vercel

## Testing on Mobile

1. Open the Vercel URL on your iPhone using Safari
2. Hold your phone in landscape orientation
3. Press the "Go!" button to start
4. Allow motion sensor access when prompted
5. Tilt your phone to steer the car