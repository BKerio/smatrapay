import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full shrink-0 border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} SmatraPay. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
