import React, { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '../lib/utils';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return; // silently reject non-images, validation happens upstream
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  return (
    <motion.div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label="Upload image for analysis. Drag and drop or click to browse."
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]',
        disabled && 'opacity-50 pointer-events-none',
        isDragOver
          ? 'border-cyan-400/60 bg-cyan-500/[0.06]'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]'
      )}
    >
      {/* Animated glow ring on drag-over */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-2xl shadow-[0_0_40px_rgba(0,229,255,0.12),inset_0_0_40px_rgba(0,229,255,0.04)] pointer-events-none"
        />
      )}

      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
          isDragOver
            ? 'bg-cyan-500/15 border border-cyan-500/30'
            : 'bg-white/[0.04] border border-white/[0.06] group-hover:bg-white/[0.06]'
        )}
      >
        {isDragOver ? (
          <ImagePlus className="h-7 w-7 text-cyan-400" />
        ) : (
          <Upload className="h-7 w-7 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
        )}
      </div>

      <div className="text-center">
        <p
          className={cn(
            'text-sm font-medium transition-colors',
            isDragOver ? 'text-cyan-300' : 'text-zinc-300'
          )}
        >
          {isDragOver ? 'Drop your image here' : 'Drag & drop an image'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          or{' '}
          <span className="text-cyan-400/80 underline underline-offset-2">
            click to browse
          </span>{' '}
          · JPEG, PNG, WebP, BMP, TIFF
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </motion.div>
  );
};
