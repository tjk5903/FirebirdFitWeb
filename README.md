# Firebird Fit Web App

A Next.js web application for managing team fitness and workouts with Supabase backend.

## Features

### Workouts
- **Workout Management**: View workouts assigned to your team or directly to you
- **Supabase Integration**: Fetches workouts using row-level security policies
- **Real-time Updates**: Workouts are fetched from the database and displayed in cards
- **Responsive Design**: Beautiful UI with loading states and error handling

#### Workout Database Schema
The workouts table contains the following columns:
- `id`: Unique identifier
- `team_id`: Team the workout belongs to
- `title`: Workout title
- `description`: Workout description
- `assigned_to`: User ID if directly assigned to a specific user
- `date_assigned`: Date when the workout was assigned
- `created_at`: Timestamp when the workout was created

#### Row-Level Security
The app uses Supabase RLS policies to ensure users can only access:
- Workouts assigned to teams they belong to (`team_id`)
- Workouts directly assigned to them (`assigned_to`)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

## Database Setup

Make sure your Supabase database has the following tables with appropriate RLS policies:

### workouts table
```sql
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  date_assigned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policy for workouts
```sql
CREATE POLICY "Users can view workouts for their teams or assigned to them" ON workouts
FOR SELECT USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ) OR assigned_to = auth.uid()
);
```

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React 