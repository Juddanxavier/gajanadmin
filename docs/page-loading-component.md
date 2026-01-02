# Page Loading Component

## Overview
Reusable loading component for consistent loading states across the application.

## Components

### 1. PageLoading
Main loading component with spinner and optional message.

### 2. PageLoadingSkeleton
Skeleton loading state for content placeholders.

## Usage

### Automatic Page Loading (Recommended)
Next.js automatically uses `app/admin/loading.tsx` during page transitions.
No code needed - it just works!

```tsx
// When navigating between pages, Next.js automatically shows:
// <PageLoading fullScreen message="Loading page..." />
```

### Manual Loading States

#### Full Screen Loading
```tsx
import { PageLoading } from "@/components/ui/page-loading";

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <PageLoading fullScreen message="Loading data..." />;
  }

  return <div>Your content</div>;
}
```

#### Inline Loading (within a section)
```tsx
import { PageLoading } from "@/components/ui/page-loading";

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div>
      <h1>My Section</h1>
      {isLoading ? (
        <PageLoading message="Loading items..." />
      ) : (
        <div>Your content</div>
      )}
    </div>
  );
}
```

#### Skeleton Loading
```tsx
import { PageLoadingSkeleton } from "@/components/ui/page-loading";

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return <div>Your content</div>;
}
```

### Custom Styling
```tsx
<PageLoading 
  className="min-h-[400px]" 
  message="Please wait..." 
/>
```

## Props

### PageLoading
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes |
| `message` | `string` | `"Loading..."` | Loading message to display |
| `fullScreen` | `boolean` | `false` | Show as full-screen overlay |

### PageLoadingSkeleton
No props - displays a predefined skeleton layout.

## Examples

### Data Fetching
```tsx
"use client";

import { useState, useEffect } from "react";
import { PageLoading } from "@/components/ui/page-loading";

export default function DataPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <PageLoading message="Fetching data..." />;
  }

  return <div>{/* Render data */}</div>;
}
```

### Form Submission
```tsx
"use client";

import { useState } from "react";
import { PageLoading } from "@/components/ui/page-loading";

export default function FormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitForm();
    setIsSubmitting(false);
  };

  return (
    <div>
      {isSubmitting && (
        <PageLoading fullScreen message="Submitting form..." />
      )}
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

### Conditional Section Loading
```tsx
import { PageLoading, PageLoadingSkeleton } from "@/components/ui/page-loading";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: charts, isLoading: chartsLoading } = useCharts();

  return (
    <div className="space-y-6">
      <section>
        <h2>Statistics</h2>
        {statsLoading ? (
          <PageLoadingSkeleton />
        ) : (
          <StatsCards data={stats} />
        )}
      </section>

      <section>
        <h2>Charts</h2>
        {chartsLoading ? (
          <PageLoading message="Loading charts..." />
        ) : (
          <Charts data={charts} />
        )}
      </section>
    </div>
  );
}
```

## Best Practices

1. **Use Automatic Loading for Navigation**
   - Next.js `loading.tsx` handles page transitions automatically
   - Provides consistent UX without extra code

2. **Use Full Screen for Critical Operations**
   - Form submissions
   - Data mutations
   - Authentication flows

3. **Use Inline Loading for Sections**
   - Individual components loading data
   - Partial page updates
   - Non-blocking operations

4. **Use Skeleton for Content Placeholders**
   - Initial page load
   - Better perceived performance
   - Maintains layout structure

5. **Provide Meaningful Messages**
   ```tsx
   // Good
   <PageLoading message="Saving your changes..." />
   
   // Bad
   <PageLoading message="Loading..." />
   ```

## Customization

### Custom Spinner Size
```tsx
// Modify the component to accept size prop
<Loader2 className="h-12 w-12 animate-spin text-primary" />
```

### Custom Colors
```tsx
<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
```

### Custom Skeleton Layout
```tsx
export function CustomSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
```

## Future Enhancements

- [ ] Progress bar variant
- [ ] Percentage-based loading
- [ ] Custom animation options
- [ ] Timeout handling
- [ ] Error state integration
