import RunableLoader from "@/components/RunableLoader";
import { motion } from "motion/react";

export function HomeTempLoader() {
  return (
    <div className="min-h-screen bg-background">
      <main className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4">
        {/* One clean animation layer: bun + tiny React logos */}
        <RunableLoader logoCount={12} />

        {/* Main content */}
        <motion.div
          className="relative z-10 mx-auto max-w-2xl space-y-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="space-y-2">
            <motion.h1
              className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Under Construction
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              This website is currently being built by Runable Bot
            </motion.p>
          </div>
          <motion.div
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            <span>Building something amazing...</span>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default HomeTempLoader;
