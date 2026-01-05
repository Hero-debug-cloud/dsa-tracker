# DSA Tracker

DSA Tracker is a comprehensive web application designed to help developers track their progress in Data Structures and Algorithms (DSA). The platform allows users to manage coding problems, log their attempts, view performance statistics, and compare their progress with others on a leaderboard.

## Features

- **Problem Management**: Add, categorize, and manage DSA problems from various platforms (LeetCode, HackerRank, etc.)
- **Attempt Tracking**: Log your problem-solving attempts with details like difficulty, time taken, and status
- **Performance Analytics**: View detailed statistics about your DSA journey including success rates, time trends, and topic-wise progress
- **Leaderboard**: Compare your performance with other users and track your ranking
- **User Authentication**: Secure login system to maintain personal progress data
- **Responsive Design**: Works seamlessly across devices

## Tech Stack

- **Frontend**: Next.js 16.1.1 with React 19.2.3
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: Turso (SQLite-based) with LibSQL client
- **Authentication**: JWT-based authentication
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner toast notifications

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- Turso account (for database)

### Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd dsa-tracker
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory and add the following:

```env
TURSO_DB_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_jwt_secret
```

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. **Open your browser**

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Database Setup

This project uses Turso, a cloud-hosted SQLite database. To set up your database:

1. Install the Turso CLI:
```bash
npm install -g @tursodatabase/turso-cli
```

2. Login to Turso:
```bash
turso auth login
```

3. Create a new database:
```bash
turso db create dsa-tracker-db
```

4. Get your database URL and authentication token:
```bash
turso db show dsa-tracker-db
turso db tokens create dsa-tracker-db
```

5. Use these values in your `.env.local` file as shown in the environment variables section.

## Project Structure

```
dsa-tracker/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── attempts/          # Attempt tracking pages
│   ├── leaderboard/       # Leaderboard pages
│   ├── login/             # Authentication pages
│   ├── problems/          # Problem management pages
│   ├── stats/             # Statistics and analytics pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── ui/                # Shadcn/ui components
│   └── Navigation.tsx     # Navigation component
├── lib/                   # Utility functions and database client
├── public/                # Static assets
└── ...
```

## API Endpoints

- `POST /api/login` - User authentication
- `GET /api/problems` - Fetch problems
- `POST /api/problems` - Create new problem
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem
- `GET /api/attempts` - Fetch attempts
- `POST /api/attempts` - Log new attempt
- `GET /api/stats` - Get user statistics
- `GET /api/leaderboard` - Get leaderboard data

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Tailwind CSS](https://tailwindcss.com/docs) - learn about styling utilities.
- [Turso Documentation](https://docs.turso.tech) - learn about Turso database.
- [shadcn/ui](https://ui.shadcn.com/) - learn about accessible UI components.

## Deploy on Vercel

The easiest way to deploy your DSA Tracker app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
