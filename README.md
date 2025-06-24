# 🏁 Vibrata Grand Prix - Kart Championship Management System

A modern, responsive web application for managing kart racing championships with automatic point calculation and drop rule implementation.

## 🎯 Features

- **Championship Standings**: Real-time leaderboard with automatic point calculation
- **Event Management**: Create and manage race events with multiple races per event
- **Mobile-First Design**: Fully responsive interface optimized for all devices
- **Race Control**: Leader authentication system for race management
- **Drop Rule**: Automatic worst result discarding per event for fairness
- **Performance Optimized**: No animations for better accessibility and performance

## 🏎️ Championship Rules

### Point System

| Position  | Points |
| --------- | ------ |
| 1st       | 20     |
| 2nd       | 17     |
| 3rd       | 15     |
| 4th       | 13     |
| 5th       | 11     |
| 6th       | 9      |
| 7th       | 7      |
| 8th       | 5      |
| 9th       | 3      |
| 10th      | 1      |
| 11th-15th | 0      |

### Bonus Points

- **Participation**: +5 points (except Max Verstappen)
- **Pole Position**: +2 points
- **Fastest Lap**: +2 points
- **Most Consistent**: +2 points

### Drop Rule

- Each driver automatically drops their worst result from each event
- Applied at the end of the championship for final standings

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Redis (for data persistence)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd kart
   ```

2. **Install dependencies**

   ```bash
   # Using npm
   npm install

   # Using bun (recommended)
   bun install
   ```

3. **Environment Setup**
   Create a `.env.local` file:

   ```env
   REDIS_URL=redis://localhost:6379
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start Redis**

   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine

   # Or install locally and run
   redis-server
   ```

5. **Run Development Server**

   ```bash
   # Using npm
   npm run dev

   # Using bun
   bun dev
   ```

6. **Open in Browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── championship/  # Championship CRUD operations
│   │   └── leaders/       # Leader authentication
│   ├── globals.css        # Global styles (F1-themed)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── championship-standings.tsx  # Leaderboard component
│   ├── race-management.tsx        # Race control interface
│   ├── leader-auth.tsx            # Authentication
│   └── footer.tsx
├── hooks/                 # Custom React hooks
│   ├── use-championship.ts       # Championship data management
│   └── use-leader-auth.ts        # Authentication logic
└── lib/                   # Utilities and business logic
    ├── championship.ts    # Point calculation logic
    ├── redis.ts          # Data persistence
    ├── types.ts          # TypeScript definitions
    └── utils.ts          # Helper functions
```

## 🎨 Design System

### Color Palette

- **Primary**: F1 Red (`oklch(0.6 0.24 15)`)
- **Background**: Dark Racing (`oklch(0.02 0.01 240)`)
- **Card**: Elevated Dark (`oklch(0.05 0.015 240)`)
- **Success**: Racing Green
- **Warning**: Racing Yellow

### Typography

- **Headers**: Courier New (Racing telemetry style)
- **Body**: Inter (Modern readability)
- **Monospace**: Courier New (Data display)

### Components

- **F1 Cards**: Racing-inspired gradient backgrounds
- **Racing Buttons**: Red gradient with subtle shadows
- **Position Icons**: Crown, Medal, Award for podium positions
- **Telemetry Data**: Monospace font with racing borders

## 📱 Mobile-First Approach

### Breakpoints

- **Mobile**: 0-640px (default)
- **Tablet**: 641px-1024px (sm:)
- **Desktop**: 1025px+ (lg:)

### Responsive Features

- **Table → Cards**: Desktop table transforms to mobile cards
- **Flexible Grid**: 1-2-3 column layouts based on screen size
- **Touch-Friendly**: Larger buttons and touch targets on mobile
- **Horizontal Scroll**: For tables that can't be cards

## 🛠️ Development Guidelines

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first styling

### Component Guidelines

1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Accessibility**: Proper ARIA labels and keyboard navigation
3. **Performance**: No unnecessary animations or heavy computations
4. **Responsive**: Use Tailwind responsive prefixes (sm:, md:, lg:)

### Adding New Features

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow File Structure**

   - Components in `src/components/`
   - Business logic in `src/lib/`
   - API routes in `src/app/api/`
   - Types in `src/lib/types.ts`

3. **Mobile-First Development**

   ```tsx
   // ✅ Good - Mobile first, then enhance
   <div className="text-sm sm:text-base lg:text-lg">

   // ❌ Bad - Desktop first
   <div className="text-lg md:text-sm">
   ```

4. **Performance Considerations**
   - No animations (removed for accessibility)
   - Minimize re-renders
   - Use `useMemo` and `useCallback` when needed
   - Optimize images with Next.js Image component

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Test Strategy

- **Unit Tests**: Business logic in `/lib`
- **Component Tests**: UI components
- **Integration Tests**: API routes
- **E2E Tests**: Critical user journeys

## 🔐 Leader Authentication

### System Overview

- JWT-based authentication
- Redis session storage
- Role-based permissions (Creator vs. Regular Leader)

### Adding Leaders

Leaders must be added through the authentication interface with:

- Name
- Email
- Password
- Role designation

## 📊 Data Models

### Core Types

```typescript
interface Driver {
  id: string;
  name: string;
  number?: number;
  isMaxVerstappen?: boolean; // Special participation rule
}

interface Race {
  id: string;
  name: string;
  position: number; // 1-15
  polePosition: boolean;
  fastestLap: boolean;
  mostConsistent: boolean;
  participated: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string;
  races: { [raceId: string]: { [driverId: string]: Race } };
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Redis instance running
- [ ] Domain configured
- [ ] SSL certificate installed
- [ ] Performance monitoring enabled

### Environment Variables

```env
REDIS_URL=redis://your-redis-instance
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
```

## 🤝 Contributing

### Pull Request Process

1. Fork the repository
2. Create feature branch from `main`
3. Make changes following guidelines
4. Test thoroughly on mobile and desktop
5. Update documentation if needed
6. Submit PR with clear description

### Issue Reporting

- Use issue templates
- Include browser/device information
- Provide steps to reproduce
- Add screenshots for UI issues

### Feature Requests

- Describe the use case
- Consider mobile impact
- Propose implementation approach
- Follow championship rule compliance

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Credits

Built with:

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Redis** - Data persistence
- **Lucide React** - Icons

---

## 🆘 Support

For issues or questions:

1. Check existing issues
2. Review documentation
3. Create new issue with template
4. Contact maintainers

**Happy Racing! 🏁**
