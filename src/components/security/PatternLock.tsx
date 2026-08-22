import React, { useState, useRef, useEffect } from 'react';

interface PatternLockProps {
  onComplete: (pattern: string) => void;
  isError?: boolean;
  disabled?: boolean;
  clearTrigger?: number;
}

export const PatternLock: React.FC<PatternLockProps> = ({
  onComplete,
  isError = false,
  disabled = false,
  clearTrigger = 0,
}) => {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Nodes are 1 through 9
  const nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    setSelectedNodes([]);
    setIsDrawing(false);
  }, [clearTrigger]);

  const getNodeCenter = (nodeIndex: number) => {
    // 3x3 grid coordinates in percentages (0 to 100)
    const row = Math.floor((nodeIndex - 1) / 3);
    const col = (nodeIndex - 1) % 3;
    return {
      x: col * 35 + 15, // 15%, 50%, 85%
      y: row * 35 + 15,
    };
  };

  const handlePointerDown = (node: number) => {
    if (disabled) return;
    setIsDrawing(true);
    setSelectedNodes([node]);
  };

  const handlePointerEnter = (node: number) => {
    if (!isDrawing || disabled) return;
    if (!selectedNodes.includes(node)) {
      setSelectedNodes((prev) => [...prev, node]);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    if (selectedNodes.length >= 3) {
      onComplete(selectedNodes.join('-'));
    } else {
      setSelectedNodes([]);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-64 h-64 mx-auto p-4 select-none touch-none bg-muted/40 rounded-3xl border border-border flex items-center justify-center"
      dir="ltr"
    >
      {/* SVG Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" viewBox="0 0 100 100">
        {selectedNodes.map((node, i) => {
          if (i === 0) return null;
          const prev = selectedNodes[i - 1];
          const start = getNodeCenter(prev);
          const end = getNodeCenter(node);
          return (
            <line
              key={`line-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isError ? '#ef4444' : '#5A6B4F'}
              strokeWidth="3.5"
              strokeLinecap="round"
              className="transition-colors duration-150"
            />
          );
        })}
      </svg>

      {/* 3x3 Dots Grid */}
      <div className="grid grid-cols-3 gap-8 w-full h-full relative z-10 p-2">
        {nodes.map((node) => {
          const isSelected = selectedNodes.includes(node);
          return (
            <div
              key={node}
              onPointerDown={() => handlePointerDown(node)}
              onPointerEnter={() => handlePointerEnter(node)}
              className="flex items-center justify-center cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSelected
                    ? isError
                      ? 'bg-red-500 text-white ring-4 ring-red-200 dark:ring-red-950 scale-110'
                      : 'bg-primary text-white ring-4 ring-primary/30 scale-110'
                    : 'bg-background border-2 border-muted-foreground/30 hover:border-primary'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-muted-foreground/50'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
