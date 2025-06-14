# Chitta - Mental Wellness Companion

A modern mental wellness application built with SvelteKit, designed to help users track their mood, practice meditation, and engage with an AI wellness coach.

## Features

- 🧘‍♀️ **Meditation Sessions** - Guided meditation with customizable durations and background music
- 😊 **Mood Tracking** - Log and track your emotional state over time
- 🤖 **AI Wellness Coach** - Chat with an AI companion for mental health support
- 📊 **Progress Tracking** - Monitor your wellness journey with detailed analytics
- 🔐 **Secure Authentication** - User accounts with Supabase authentication
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎵 **Background Music** - Free meditation music with streak-based custom upload unlock

## Tech Stack

- **Frontend**: SvelteKit 5, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **Package Manager**: npm
- **Deployment**: Netlify

## Prerequisites

- Node.js 18 or higher
- npm (recommended package manager)

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chitta
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Supabase credentials in the `.env` file.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Deployment

The application is configured for Netlify deployment:

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify (the build output will be in the `build` directory)

## Meditation Features

### Background Music

The app includes several free meditation music options:

- **Nature Sounds** - Forest, rain, and ocean sounds
- **Ambient Music** - Soft instrumental melodies
- **Binaural Beats** - Frequency-based meditation aid
- **Tibetan Bowls** - Traditional singing bowls
- **White Noise** - Consistent background noise
- **Custom Upload** - Upload your own audio (unlocked after 7-day streak)

### Streak System

- Track consecutive days of meditation
- Unlock custom music upload after maintaining a 7-day streak
- Visual progress indicators and streak counters
- Motivational messages based on current streak

### Mobile Optimization

- Compact grid layouts for mood selection
- Smaller emoji and icon sizes for better mobile display
- Touch-friendly interface elements
- Responsive design for all screen sizes

## Audio Files Setup

To add actual meditation music files:

1. Download free meditation music from sources like:
   - Freesound.org
   - Zapsplat.com (free tier)
   - YouTube Audio Library
   - Pixabay Music

2. Convert files to MP3 format if needed

3. Place files in the `static/audio/` directory:
   - `nature-sounds.mp3`
   - `ambient-music.mp3`
   - `binaural-beats.mp3`
   - `tibetan-bowls.mp3`
   - `white-noise.mp3`

4. Ensure files are optimized for web (compressed, appropriate bitrate)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run type checking
- `npm run check:watch` - Run type checking in watch mode

## Database Setup

The application uses Supabase for data storage. The database schema includes:

- **users** - User profiles and authentication
- **mood_entries** - Mood tracking data
- **meditation_sessions** - Meditation session records with streak tracking
- **chat_conversations** - AI chat history
- **motivation_quotes** - Inspirational quotes
- **quote_interactions** - User interactions with quotes
- **quote_comments** - User comments on quotes

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Install dependencies: `npm install`
5. Run the development server: `npm run dev`
6. Test your changes
7. Commit your changes: `git commit -m 'Add feature'`
8. Push to the branch: `git push origin feature-name`
9. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions about mental wellness resources, please consult with qualified mental health professionals. This application is designed to supplement, not replace, professional mental health care.

## Audio Attribution

When using free music files, ensure proper attribution as required by the license. Common sources for free meditation music:

- **Freesound.org** - Creative Commons licensed sounds
- **Pixabay Music** - Royalty-free music
- **YouTube Audio Library** - Free music for creators
- **Zapsplat** - Free sound effects and music (with attribution)

Always check the specific license requirements for each audio file used.