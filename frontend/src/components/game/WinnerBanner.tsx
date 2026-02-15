import { motion } from 'framer-motion';

/** Animated winner banner for leg and match completion moments. */
export function WinnerBanner({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-xl bg-success/20 p-3 text-center text-success"
    >
      🏆 {text}
    </motion.div>
  );
}
