// components/LazyPartForm.jsx
import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the heavy form component
const PartForm = lazy(() => import('./PartForm'));

const FormLoadingSpinner = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-slate-800 rounded-lg p-6 flex items-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-green-400" />
      <span className="text-slate-200">Loading form...</span>
    </div>
  </div>
);

const LazyPartForm = (props) => {
  if (!props.isOpen && !props.show) {
    return null;
  }

  return (
    <Suspense fallback={<FormLoadingSpinner />}>
      <PartForm {...props} />
    </Suspense>
  );
};

export default LazyPartForm;