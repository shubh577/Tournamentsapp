
"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function LiquidBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // To prevent hydration mismatches, the outer container must be identical on server and client initial render.
  // We only render the animated children once the component has mounted on the client.
  return (
    <div className="fixed inset-0 liquid-bg z-[-1]">
      {mounted && (
        <>
          <motion.div
            animate={{
              x: [0, 50, -50, 0],
              y: [0, -50, 50, 0],
              scale: [1, 1.2, 0.8, 1],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mesh-gradient bg-primary/20 w-[600px] h-[600px] rounded-full top-[-10%] left-[-10%]"
          />
          <motion.div
            animate={{
              x: [0, -30, 30, 0],
              y: [0, 60, -60, 0],
              scale: [1, 0.9, 1.1, 1],
              rotate: [360, 270, 180, 90, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mesh-gradient bg-accent/15 w-[500px] h-[500px] rounded-full bottom-[-20%] right-[-10%]"
          />
          <motion.div
            animate={{
              x: [0, 40, -40, 0],
              y: [0, 40, -40, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
            className="mesh-gradient bg-purple-500/10 w-[400px] h-[400px] rounded-full top-[30%] left-[40%]"
          />
        </>
      )}
    </div>
  )
}
