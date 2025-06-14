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

## Live Demo

Visit [https://chitta.online](https://chitta.online) to see the application in action.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (recommended package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/devendradora/chitta.git
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