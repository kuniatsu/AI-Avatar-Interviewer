# Development Guide - AI Avatar Interviewer

## Project Status

### ✅ Phase 1 Complete: 3D Avatar Display Framework
- Next.js project initialized with TypeScript
- React Three Fiber setup for 3D rendering
- Basic 3D scene with lighting and placeholder avatar
- Development environment ready for testing

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

The application features:
- Full-screen 3D canvas
- Interactive camera controls (OrbitControls)
- Placeholder cube avatar
- Lighting setup for character rendering

### Build
```bash
npm run build
npm start
```

## Project Structure

```
├── components/
│   ├── AvatarScene.tsx      # Main 3D scene component
│   ├── VRMLoader.tsx         # VRM model loader (stub for Phase 2)
│   └── _document.tsx         # Next.js document
├── pages/
│   ├── _app.tsx              # App wrapper
│   └── index.tsx             # Home page
├── styles/
│   └── globals.css           # Global styles
├── public/                   # Static assets
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Next Steps (Phase 2)

### LLM Integration
- Implement Claude API integration
- Create conversation logic component
- Handle audio input/output

### VRM Model Integration
- Implement GLTFLoader with VRM support
- Load actual VRM models
- Setup animation system

### Lip-sync Implementation
- Audio analysis for mouth movement
- Real-time morph target control
- Sync with speech synthesis

## Technologies Used

- **Framework**: Next.js 16
- **UI Library**: React 19
- **3D Rendering**: Three.js + React Three Fiber
- **3D Libraries**: @react-three/drei, @pixiv/three-vrm
- **Language**: TypeScript
- **Styling**: CSS + Tailwind CSS

## Notes for Claude Code Development

- Hot reload works during `npm run dev`
- TypeScript strict mode enabled
- All components are React functional components with hooks
- Three.js handles low-level 3D operations
