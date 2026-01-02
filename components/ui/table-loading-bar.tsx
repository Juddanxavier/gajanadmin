"use client";

import { motion } from "framer-motion";

interface TableLoadingBarProps {
  isLoading: boolean;
}

export function TableLoadingBar({ isLoading }: TableLoadingBarProps) {
  return (
    <div className="h-0.5 w-full bg-transparent overflow-hidden relative">
      {isLoading && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-primary shadow-[0_0_10px_purple]"
        />
      )}
    </div>
  );
}
