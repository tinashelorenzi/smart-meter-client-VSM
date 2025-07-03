import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const Loading = ({ fullScreen = true }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <LoadingContent />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <LoadingContent />
    </div>
  );
};

const LoadingContent = () => {
  return (
    <div className="text-center">
      <motion.div
        className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Zap className="w-8 h-8 text-white" />
      </motion.div>
      
      <motion.div
        className="flex space-x-2 justify-center mb-4"
        initial="start"
        animate="end"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-primary-500 rounded-full"
            variants={{
              start: { y: 0 },
              end: { y: -10 }
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.1
            }}
          />
        ))}
      </motion.div>
      
      <motion.p
        className="text-slate-300 text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading SmartMeter...
      </motion.p>
    </div>
  );
};

export default Loading;