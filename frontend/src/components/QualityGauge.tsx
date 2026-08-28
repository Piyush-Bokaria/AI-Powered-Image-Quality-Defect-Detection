import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { scoreColor } from '../lib/utils';

interface QualityGaugeProps {
  score: number; // 0–100
  size?: number;
}

export const QualityGauge: React.FC<QualityGaugeProps> = ({
  score,
  size = 180,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const color = scoreColor(score);
  const trackColor = 'rgba(255,255,255,0.04)';

  // Animated counter
  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const gaugeData = [
    { value: score, color },
    { value: 100 - score, color: trackColor },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Quality score: ${score} out of 100`}
    >
      <PieChart width={size} height={size}>
        <Pie
          data={gaugeData}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size / 2 - 14}
          outerRadius={size / 2 - 4}
          startAngle={225}
          endAngle={-45}
          dataKey="value"
          stroke="none"
          cornerRadius={8}
        >
          {gaugeData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-4xl font-bold tabular-nums tracking-tight"
          style={{ color }}
        >
          {displayScore}
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-0.5">
          Quality
        </span>
      </div>

      {/* Subtle glow behind gauge */}
      <div
        className="absolute inset-4 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};
