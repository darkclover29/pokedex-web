import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import type { SpringOptions } from 'framer-motion';
import { Children, cloneElement, useEffect, useMemo, useRef, useState, isValidElement } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';

import './Dock.css';

interface DockItemData {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  /** When true, renders an active indicator dot below the icon. */
  isActive?: boolean;
}

interface DockItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: any;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  label: string;
  isSmall?: boolean;
  isActive?: boolean;
}

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  isSmall = false,
  isActive = false,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);
  const rectRef = useRef<{ x: number; width: number } | null>(null);

  const targetSize = useTransform(mouseX, (val: number) => {
    if (val === Infinity) {
      rectRef.current = null;
      return baseItemSize;
    }
    if (!rectRef.current && ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
    const rect = rectRef.current ?? {
      x: 0,
      width: baseItemSize
    };
    const dist = Math.abs(val - rect.x - baseItemSize / 2);
    if (dist >= distance) return baseItemSize;
    const pct = 1 - dist / distance;
    return baseItemSize + (magnification - baseItemSize) * pct;
  });

  useEffect(() => {
    const handleResize = () => {
      rectRef.current = null;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const size = useSpring(targetSize, spring);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      ref={ref}
      style={isSmall ? {} : {
        width: size,
        height: size
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={label}
      onKeyDown={handleKeyDown}
      aria-pressed={isActive}
    >
      {Children.map(children, child => {
        if (isValidElement(child)) {
          return cloneElement(child, { isHovered, isSmall } as any);
        }
        return child;
      })}
      {/* Active indicator dot */}
      {isActive && (
        <span
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}

interface DockLabelProps {
  children: ReactNode;
  className?: string;
  isHovered?: any;
  isSmall?: boolean;
}

function DockLabel({ children, className = '', isHovered, isSmall = false }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isSmall) {
      setIsVisible(true);
      return;
    }
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest: number) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered, isSmall]);

  if (isSmall) {
    return (
      <div className={`dock-label ${className}`} role="tooltip">
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DockIconProps {
  children: ReactNode;
  className?: string;
}

function DockIcon({ children, className = '' }: DockIconProps) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  spring?: SpringOptions;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  dockHeight?: number;
  baseItemSize?: number;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsSmall(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const finalBaseItemSize = isSmall ? Math.round(baseItemSize * 0.7) : baseItemSize;
  const finalMagnification = isSmall ? Math.round(magnification * 0.7) : magnification;
  const finalPanelHeight = isSmall ? Math.round(panelHeight * 0.7) : panelHeight;

  const maxHeight = useMemo(
    () => Math.max(dockHeight, finalMagnification + finalMagnification / 2 + 4),
    [finalMagnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [finalPanelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div style={{ height, scrollbarWidth: 'none' }} className="dock-outer">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel gap-1.5 sm:gap-4 ${className}`}
        style={{ height: finalPanelHeight }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
             mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={finalMagnification}
            baseItemSize={finalBaseItemSize}
            label={item.label}
            isSmall={isSmall}
            isActive={item.isActive}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
