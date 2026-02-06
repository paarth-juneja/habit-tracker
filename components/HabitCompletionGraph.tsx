'use client';

import React, { useMemo, useState, useEffect } from 'react';
import styles from './HabitCompletionGraph.module.css';

interface Habit {
    id: string;
    completedDays: number[];
    createdAt?: number;
}

interface HabitCompletionGraphProps {
    habits: Habit[];
    year: number;
    month: number;
    leftOffset?: number;
}

export default function HabitCompletionGraph({ habits, year, month, leftOffset }: HabitCompletionGraphProps) {
    const [hoverData, setHoverData] = useState<{ x: number, y: number, day: number, percent: number, completed: number, total: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };

        checkMobile();

        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);

        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    const daysInMonth = new Date(year, month, 0).getDate();

    // Grid Dimensions (Must match HabitTracker.module.css)
    // Desktop: 8 + 28 + 244 = 280. 
    // Mobile: 8 + 28 + 44 + 160 = 240.
    const defaultLeftOffset = isMobile ? 240 : 280;
    const LEFT_OFFSET = leftOffset !== undefined ? leftOffset : defaultLeftOffset;
    const COL_WIDTH = isMobile ? 32 : 36;

    const RIGHT_PADDING = 60;
    const GRAPH_HEIGHT = 160;
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 30;

    const width = LEFT_OFFSET + (daysInMonth * COL_WIDTH) + RIGHT_PADDING;
    const graphHeight = GRAPH_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    // Calculate data points
    const dataPoints = useMemo(() => {
        const points = [];
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
        const currentDay = today.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            // Stop drawing line for future dates
            if (isCurrentMonth && day > currentDay) {
                points.push({ day, percent: null, completed: 0, total: 0, isFuture: true });
                continue;
            }

            const currentDate = new Date(year, month - 1, day, 23, 59, 59);

            const activeHabits = habits.filter(h =>
                !h.createdAt || h.createdAt <= currentDate.getTime()
            );

            if (activeHabits.length === 0) {
                // No active habits on this day
                points.push({ day, percent: null, completed: 0, total: 0, isFuture: false });
                continue;
            }

            const completedCount = activeHabits.filter(h => h.completedDays.includes(day)).length;
            const percentage = (completedCount / activeHabits.length) * 100;

            points.push({
                day,
                percent: percentage,
                completed: completedCount,
                total: activeHabits.length,
                isFuture: false
            });
        }
        return points;
    }, [habits, year, month, daysInMonth]);

    const maxPercent = Math.max(...dataPoints.map(p => p.percent || 0));
    const yMax = Math.max(10, Math.ceil(maxPercent / 10) * 10);

    const getX = (day: number) => LEFT_OFFSET + ((day - 1) * COL_WIDTH) + (COL_WIDTH / 2);
    const getY = (percent: number) => PADDING_TOP + graphHeight - (percent / yMax) * graphHeight;

    const pathD = useMemo(() => {
        let d = '';
        let moving = false;

        dataPoints.forEach((point) => {
            if (point.percent === null) {
                moving = false;
                return;
            }

            const x = getX(point.day);
            const y = getY(point.percent);

            if (!moving) {
                d += `M ${x} ${y}`;
                moving = true;
            } else {
                d += ` L ${x} ${y}`;
            }
        });
        return d;
    }, [dataPoints, yMax, LEFT_OFFSET, COL_WIDTH]);

    const yTicks = useMemo(() => {
        const ticks = [];
        const step = 20;
        for (let i = 0; i <= yMax; i += step) {
            ticks.push(i);
        }
        return ticks;
    }, [yMax]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svgRect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;

        const adjustedX = mouseX - LEFT_OFFSET;
        const index = Math.floor(adjustedX / COL_WIDTH);
        const day = index + 1;

        if (day >= 1 && day <= daysInMonth) {
            const point = dataPoints.find(p => p.day === day);
            // Only show tooltip if it's not a future date (percent !== null)
            if (point && point.percent !== null) {
                setHoverData({
                    x: getX(day),
                    y: getY(point.percent),
                    day: point.day,
                    percent: point.percent,
                    completed: point.completed,
                    total: point.total
                });
            } else {
                setHoverData(null);
            }
        } else {
            setHoverData(null);
        }
    };

    return (
        <div className={styles.container}>
            {hoverData && (
                <div
                    className={styles.tooltip}
                    style={{
                        left: `${hoverData.x}px`,
                        top: `${hoverData.y - 10}px`
                    }}
                >
                    <span className={styles.tooltipDate}>
                        {new Date(year, month - 1, hoverData.day).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className={styles.tooltipValue}>
                        {Math.round(hoverData.percent)}%
                    </div>
                </div>
            )}

            <svg
                width={width}
                height={GRAPH_HEIGHT}
                className={styles.svg}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoverData(null)}
            >
                {/* Y Axis Grid & Labels */}
                {yTicks.map(tick => {
                    const y = getY(tick);
                    return (
                        <g key={tick}>
                            <line
                                x1={LEFT_OFFSET}
                                y1={y}
                                x2={width - RIGHT_PADDING}
                                y2={y}
                                className={styles.gridLine}
                            />
                            <text
                                x={LEFT_OFFSET - 10}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                className={styles.axisLabel}
                            >
                                {tick}%
                            </text>
                        </g>
                    );
                })}

                {/* Vertical Grid Lines & X Axis Labels */}
                {dataPoints.map(point => {
                    const x = getX(point.day);
                    return (
                        <g key={point.day}>
                            <line
                                x1={x}
                                y1={PADDING_TOP}
                                x2={x}
                                y2={GRAPH_HEIGHT - PADDING_BOTTOM}
                                className={styles.gridLine}
                                strokeDasharray="2 2"
                                style={{ opacity: point.isFuture ? 0.02 : 0.1 }}
                            />
                            <text
                                x={x}
                                y={GRAPH_HEIGHT - 5}
                                textAnchor="middle"
                                className={styles.axisLabel}
                                style={{ opacity: point.isFuture ? 0.3 : 1 }}
                            >
                                {point.day}
                            </text>
                        </g>
                    );
                })}

                {/* Axes Lines */}
                {/* Y Axis Line */}
                <line
                    x1={LEFT_OFFSET}
                    y1={PADDING_TOP}
                    x2={LEFT_OFFSET}
                    y2={GRAPH_HEIGHT - PADDING_BOTTOM}
                    className={styles.axisLine}
                />
                {/* Y Axis Arrow */}
                <path
                    d={`M ${LEFT_OFFSET - 3} ${PADDING_TOP + 5} L ${LEFT_OFFSET} ${PADDING_TOP} L ${LEFT_OFFSET + 3} ${PADDING_TOP + 5}`}
                    fill="none"
                    className={styles.axisLine}
                />

                {/* X Axis Line */}
                <line
                    x1={LEFT_OFFSET}
                    y1={GRAPH_HEIGHT - PADDING_BOTTOM}
                    x2={width - RIGHT_PADDING}
                    y2={GRAPH_HEIGHT - PADDING_BOTTOM}
                    className={styles.axisLine}
                />
                {/* X Axis Arrow */}
                <path
                    d={`M ${width - RIGHT_PADDING - 5} ${GRAPH_HEIGHT - PADDING_BOTTOM - 3} L ${width - RIGHT_PADDING} ${GRAPH_HEIGHT - PADDING_BOTTOM} L ${width - RIGHT_PADDING - 5} ${GRAPH_HEIGHT - PADDING_BOTTOM + 3}`}
                    fill="none"
                    className={styles.axisLine}
                />

                {/* Data Line */}
                <path d={pathD} className={styles.linePath} stroke="#ffffff" />

                {/* Data Points - Active only */}
                {dataPoints.map(point => {
                    if (point.percent === null) return null;
                    const x = getX(point.day);
                    const y = getY(point.percent);
                    return (
                        <circle
                            key={point.day}
                            cx={x}
                            cy={y}
                            className={`${styles.point} ${hoverData?.day === point.day ? styles.active : ''}`}
                        />
                    );
                })}
            </svg>
        </div>
    );
}
