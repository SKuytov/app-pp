// components/LazyPartDetailModal.jsx
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy modal component
const PartDetailModal = lazy(() => import('./PartDetailModal'));

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-800 rounded-lg p-6 flex items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      <span className="text-slate-200">Loading part details...</span>
    </div>
  </div>
);

const LazyPartDetailModal = (props) => {
  if (!props.isOpen) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PartDetailModal {...props} />
    </Suspense>
  );
};

export default LazyPartDetailModal;