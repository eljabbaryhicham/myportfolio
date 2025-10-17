'use client';

import { Loader } from 'lucide-react';

const Preloader = () => {
  return (
    <div className="flex items-center justify-center">
      <Loader className="w-12 h-12 animate-spin text-primary" />
    </div>
  );
};

export default Preloader;
