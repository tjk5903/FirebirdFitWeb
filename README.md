# Firebird Fit - Performance Dashboard

A modern, responsive web dashboard for fitness tracking and team management, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### 🏃‍♂️ Role-Based Dashboards
- **Coach Dashboard**: Team overview, workout management, athlete tracking
- **Athlete Dashboard**: Personal progress, workout scheduling, team communication

### 🎨 Design
- Professional blue/gold color scheme
- Responsive design for desktop, tablet, and mobile
- Modern UI with subtle animations
- Clean card-based layout

### 🔐 Authentication
- Simple email/password authentication
- Role selection (Coach/Athlete)
- Persistent session management
- Protected routes

### 📊 Dashboard Features

#### Coach Features:
- Team overview with athlete statistics
- Create and manage workouts
- Schedule management
- Team messaging system
- Recent activity tracking

#### Athlete Features:
- Personal workout progress
- Next scheduled workout display
- Team messages and notifications
- Upcoming events calendar
- Quick action buttons

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Authentication**: Local storage (demo)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FirebirdFitWeb
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials
- Use any email/password combination
- Select your role (Coach or Athlete) during login

## Project Structure

```
FirebirdFitWeb/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── dashboard/        # Dashboard components
│   └── ui/              # UI components
├── contexts/            # React contexts
├── lib/                 # Utility functions
└── public/              # Static assets
```

## Color Scheme

- **Royal Blue**: #2B5CB0 (Primary)
- **Gold**: #FFD700 (Accent)
- **Soft White**: #FAFAFA (Background)
- **Dark Blue**: #1E3A8A (Hover states)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository. 