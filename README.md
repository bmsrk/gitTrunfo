<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎮 Git Trunfo

**A GitHub-powered card battle game**

[![Deploy to GitHub Pages](https://github.com/bmsrk/gitTrunfo/actions/workflows/deploy.yml/badge.svg)](https://github.com/bmsrk/gitTrunfo/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://bmsrk.github.io/gitTrunfo/)

[🚀 Play Now](https://bmsrk.github.io/gitTrunfo/) | [📖 Documentation](#features) | [🐛 Report Bug](../../issues)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Demo](#demo)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [How to Play](#how-to-play)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About

**Git Trunfo** is an interactive card battle game that turns GitHub repositories into powerful battle cards! Challenge your friends or battle against CPU opponents using repository statistics as combat attributes. The game features a retro-inspired terminal UI with multiple themes, real-time battle commentary, and smooth animations.

Inspired by the classic Top Trumps card game, Git Trunfo brings a unique twist to GitHub profiles by gamifying repository statistics like stars, forks, watchers, and more.

---

## ✨ Features

### 🎴 Core Gameplay
- **GitHub Integration**: Fetch real user profiles and repositories from GitHub API
- **Card Battles**: Compare repository stats (stars, forks, watchers, size, open issues)
- **AI Opponent**: Play against a smart CPU that picks optimal stats
- **Offline Mode**: Fallback to dummy data when GitHub API is unavailable

### 🎨 Visual Experience
- **4 Retro Themes**: Choose from Retro, Dracula, Monokai, and Synthwave color schemes
- **Terminal UI**: Authentic terminal-style interface with cyberpunk aesthetics
- **Smooth Animations**: Card flips, battle effects, and transition animations
- **Responsive Design**: Fully playable on desktop and mobile devices

### 🔊 Audio & Effects
- **Retro Sound Effects**: Synthesized 8-bit style audio for all game actions
- **Battle Commentary**: Dynamic commentary system for exciting play-by-play
- **Battle Log**: Real-time scrolling terminal log of all game events

### 💡 Technical Features
- **TypeScript**: Fully typed for better code reliability
- **React 18**: Modern React with hooks and functional components
- **Vite**: Lightning-fast build tool and dev server
- **GitHub API**: Real-time data fetching from GitHub
- **Graceful Degradation**: Works offline with fallback data

---

## 🎮 Demo

### **[🌐 Live Demo - Play Now!](https://bmsrk.github.io/gitTrunfo/)**

Try the game live on GitHub Pages! Challenge GitHub users and see whose repositories reign supreme.

### Game Modes
1. **Player vs Player**: Enter two GitHub usernames to battle
2. **Player vs CPU**: Enter any username and "CPU" as opponent

---

## 🛠 Technology Stack

- **Frontend Framework**: React 18.2
- **Language**: TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: TailwindCSS (inline utility classes)
- **Icons**: Lucide React
- **APIs**: 
  - GitHub REST API v3
  - Gemini AI (optional, for enhanced commentary)
- **Audio**: Web Audio API
- **Deployment**: GitHub Pages via GitHub Actions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **GitHub Account** (for API access)
- **(Optional)** Gemini API Key for AI-powered commentary

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bmsrk/gitTrunfo.git
   cd gitTrunfo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **(Optional) Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   > **Note**: The game works without a Gemini API key using fallback commentary templates.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` and start playing!

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 🎲 How to Play

### Setup Phase
1. Enter **Player 1** GitHub username (e.g., `facebook`, `google`, `microsoft`)
2. Enter **Player 2** GitHub username or type `CPU` for AI opponent
3. Click **"INITIALIZE BATTLE"** to start

### Battle Phase
1. View your top card and opponent's hidden card
2. Select a stat to battle with (Stars, Forks, Watchers, Size, or Issues)
3. Cards are revealed and compared
4. Winner takes both cards and adds them to their deck
5. First player to run out of cards loses!

### Strategy Tips
- 💫 **Stars** are usually high for popular projects
- 🍴 **Forks** indicate active community engagement
- 📦 **Size** varies greatly - sometimes bigger is better!
- 👀 **Watchers** show ongoing interest
- 🐛 **Issues** can be a double-edged sword

---

## ⚙️ Configuration

### Themes

The game includes 4 built-in themes:
- **Retro**: Classic cyan terminal aesthetic
- **Dracula**: Popular dark purple theme
- **Monokai**: Sublime Text inspired colors
- **Synthwave**: Neon cyberpunk vibes

Switch themes in the setup screen before starting a game.

### Game Rules

Modify game logic in `/services/githubService.ts`:
- Minimum repositories required
- Deck size (top N repositories)
- Repository sorting method

### AI Behavior

Adjust CPU difficulty in `/services/geminiService.ts`:
- Stat weighting for AI decisions
- Random vs optimal stat selection

---

## 🚢 Deployment

### GitHub Pages (Automated)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `main`.

**Setup Steps:**
1. Go to repository **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. Push to `main` branch
4. Wait for workflow to complete
5. Access your game at `https://[username].github.io/gitTrunfo/`

### Manual Deployment

```bash
npm run build
# Upload contents of dist/ to your hosting provider
```

### Environment Variables in Production

For deployment with Gemini AI commentary:
- Set `GEMINI_API_KEY` in your hosting platform's environment variables
- Or inject at build time using GitHub Secrets

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for new features
- Test on multiple screen sizes
- Update documentation for new features

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Inspired by the classic **Top Trumps** card game
- Built with ❤️ using modern web technologies
- GitHub API for real-time data
- Lucide React for beautiful icons
- Terminal aesthetics inspired by hacker culture

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Live Demo**: [https://bmsrk.github.io/gitTrunfo/](https://bmsrk.github.io/gitTrunfo/)

---

<div align="center">

**[⬆ back to top](#-git-trunfo)**

Made with 💻 and ☕

</div>
