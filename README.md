# 💄 Lip Filter - WebRTC + MediaPipe FaceMesh

A real-time lip filter application built with Next.js, TypeScript, and MediaPipe FaceMesh for accurate lip detection and overlay.

## Features

- 🎥 **Real-time camera access** with WebRTC
- 👄 **Accurate lip detection** using MediaPipe FaceMesh with 468 facial landmarks
- 🎨 **Color customization** with opacity, hue, and saturation controls
- 📸 **Photo capture** functionality
- 🪞 **Mirror mode** for natural selfie experience
- 🎯 **Precise lip tracking** using anatomically correct mouth landmarks
- 📱 **Responsive design** that works on desktop and mobile

## Technology Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MediaPipe FaceMesh** - Face and lip detection
- **WebRTC** - Camera access

## Getting Started

### Prerequisites

- Node.js 18+ 
- Modern browser with camera access
- HTTPS connection (required for camera access in production)

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <your-repo-url>
   cd lip-filter
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Start Camera**: Click "Start Camera" to begin video capture
2. **Adjust Settings**: Use the opacity, hue, and saturation sliders to customize the lipstick effect
3. **Choose Colors**: Select from the predefined color palette
4. **Capture**: Click the camera button to save a photo with the filter applied

## How It Works

The application uses MediaPipe FaceMesh to detect 468 facial landmarks in real-time. It specifically tracks the mouth landmarks to accurately apply lipstick effects:

- **Outer mouth landmarks**: [61,146,91,181,84,17,314,405,321,375,291]
- **Inner mouth landmarks**: [78,95,88,178,87,14,317,402,318,324,308]

The lip overlay is drawn using HTML5 Canvas with precise coordinate mapping from the normalized MediaPipe landmarks to screen coordinates.

## Development

### Project Structure

\`\`\`
lip-filter/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── types/
│   └── mediapipe.d.ts    # MediaPipe TypeScript declarations
├── next.config.ts        # Next.js configuration
└── package.json
\`\`\`

### Key Components

- **FaceMesh Integration**: Loads MediaPipe libraries and initializes face detection
- **Camera Management**: Handles WebRTC stream setup and cleanup
- **Canvas Rendering**: Draws lipstick overlay with proper coordinate transformation
- **UI Controls**: Provides real-time adjustment of filter parameters

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Supported with camera access permission

## Deployment Notes

- Requires HTTPS for camera access in production
- MediaPipe models are loaded from CDN
- Consider implementing proper error boundaries for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- MediaPipe team for the face detection models
- Next.js team for the excellent React framework
- Tailwind CSS for the utility-first styling approach
