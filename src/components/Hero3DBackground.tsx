import React, { Suspense } from 'react';
import { Skeleton } from './ui/skeleton';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

const Hero3DBackground = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-30 dark:opacity-50 blur-sm">
      <Suspense fallback={<Skeleton className="w-full h-full" />}>
        <Spline scene="https://prod.spline.design/VCI1ZORPSi-S8tln/scene.splinecode" />
      </Suspense>
    </div>
  );
};

export default Hero3DBackground;