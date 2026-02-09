"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function BreathingGrid({ className }: { className?: string }) {
    const [highlightedCells, setHighlightedCells] = useState<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });

    // Calculate grid dimensions based on container size
    useEffect(() => {
        const updateDimensions = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            const cols = Math.floor(width / 40); // 40px cell size
            const rows = Math.floor(height / 40);
            setDimensions({ rows, cols });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Randomly highlight cells
    useEffect(() => {
        if (dimensions.cols === 0) return;

        const interval = setInterval(() => {
            setHighlightedCells((prev) => {
                const next = new Set(prev);
                // Add random cell
                const cellToAdd = Math.floor(Math.random() * (dimensions.rows * dimensions.cols));

                // Keep roughly 5-8 cells active at once
                if (next.size > 8) {
                    // Remove a random existing one
                    const cells = Array.from(next);
                    const cellToRemove = cells[Math.floor(Math.random() * cells.length)];
                    next.delete(cellToRemove);
                }

                // 70% chance to add, 30% chance to just remove (creates breathing rhythm)
                if (Math.random() > 0.3) {
                    next.add(cellToAdd);

                    // Auto-remove this specific cell after 2-4 seconds
                    setTimeout(() => {
                        setHighlightedCells((current) => {
                            const updated = new Set(current);
                            updated.delete(cellToAdd);
                            return updated;
                        });
                    }, 2000 + Math.random() * 2000);
                }

                return next;
            });
        }, 800);

        return () => clearInterval(interval);
    }, [dimensions]);

    return (
        <div
            ref={containerRef}
            className={cn("absolute inset-0 overflow-hidden", className)}
        >
            <div
                className="absolute inset-0 grid"
                style={{
                    gridTemplateColumns: `repeat(${dimensions.cols}, 40px)`,
                    gridTemplateRows: `repeat(${dimensions.rows}, 40px)`,
                    // Subtle grid lines
                    backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            >
                <AnimatePresence>
                    {Array.from(highlightedCells).map((index) => {
                        const row = Math.floor(index / dimensions.cols);
                        const col = index % dimensions.cols;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="relative bg-primary/10 border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                                style={{
                                    gridColumn: col + 1,
                                    gridRow: row + 1,
                                }}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/50" />
        </div>
    );
}
