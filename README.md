# 💄 Lip Filter App

A modern web application that helps users find their perfect lipstick shade through a personality quiz and AI-powered virtual try-on experience.

## ✨ Features

### 🏠 **Home Screen**
- Beautiful landing page with app introduction
- Clear call-to-action to start the personality quiz
- Feature highlights showcasing the app's capabilities

### 🎯 **Personality Quiz**
- Interactive 8-question personality assessment
- Questions cover workplace style, personality traits, skin tone, and preferences
- Real-time progress tracking
- Pantone color recommendation algorithm with 8 curated shades

### 🎨 **Virtual Lip Filter**
- AI-powered lip detection using MediaPipe FaceMesh
- Pre-selected color based on quiz results
- Real-time lipstick application with adjustable settings
- Camera controls and color customization options
- High-quality image capture functionality

### 📸 **Capture Result**
- Display captured image with applied lipstick
- Download functionality for saving results
- Social media sharing options (Instagram, Facebook, Twitter)
- Options to try different colors or take a new quiz

## 🚀 Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: MediaPipe FaceMesh for facial landmark detection
- **Camera**: WebRTC for real-time video processing
- **Deployment**: Ready for Vercel deployment

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lip-filter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage Flow

1. **Start**: Users land on the home screen with app introduction
2. **Quiz**: Take an 8-question personality quiz covering workplace style and preferences
3. **Recommendation**: Receive personalized Pantone lipstick color recommendations
4. **Try-On**: Use the AI-powered virtual lip filter with the recommended color
5. **Capture**: Take a photo with the applied lipstick
6. **Share**: Download and share results on social media platforms

## 🎨 Color Recommendation Algorithm

The app uses a sophisticated algorithm that considers:
- **Workplace Style**: Bold, Neutral, Soft
- **Priority Approach**: Presentation-focused, Daily routine, Team collaboration
- **Mistake Handling**: Direct resolution, Seeking opinions, Delayed action
- **Lunch Preferences**: Spicy food, Quick sandwich, Homemade meals
- **Leadership Style**: Strong and fiery, Social and mingling, Kind and thoughtful
- **Skin Tone**: Warm, Neutral, Cool
- **Accessory Preference**: Gold, Mixed metals, Silver
- **Workspace Style**: Red heels & perfume, Coffee & mirror, Plushies & diffusers

**8 Pantone Color Options:**
- Barely Peachy (#BB5F43)
- Coral Courage (#BC494F)
- Charming Pink (#AA3E4C)
- Mauve Ambition (#B04A5A)
- Fiery Crimson (#A4343A)
- Mahogany Mission (#8B4513)
- Rosewood Blaze (#A0522D)
- Brick Era (#A3473D)

## 🔧 Technical Features

- **Real-time Processing**: Live video feed with instant lipstick application
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **High Performance**: Optimized rendering and smooth user experience
- **Cross-browser Compatibility**: Works on all modern browsers
- **HTTPS Required**: Camera access requires secure connection

## 📸 Social Media Integration

- **Instagram**: Direct link with download instructions
- **Facebook**: Native sharing with custom text
- **Twitter**: Tweet sharing with hashtags
- **Download**: High-quality image download for offline sharing

## 🎯 Future Enhancements

- [ ] User accounts and result history
- [ ] More color palettes and finishes
- [ ] Product recommendations and shopping links
- [ ] Advanced face filters and effects
- [ ] Mobile app version
- [ ] AR try-on capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- MediaPipe for facial landmark detection
- Next.js team for the amazing framework
- Tailwind CSS for the beautiful styling system
- All contributors and users of this project

---

**Made with ❤️ for beauty enthusiasts everywhere**
