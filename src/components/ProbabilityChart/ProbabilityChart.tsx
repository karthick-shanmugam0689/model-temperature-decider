/**
 * ProbabilityChart Component
 * 
 * Animated bar chart showing token probability distribution using Recharts.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatProbability, getTemperatureColor } from '../../utils/probability';
import { BAR_ANIMATION_DURATION } from '../../utils/constants';
import type { 
  ProbabilityChartProps, 
  ChartDataPoint, 
  CustomTooltipProps, 
  CustomXAxisTickProps 
} from './types';

/**
 * Custom tooltip component for displaying detailed token info
 */
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length || !payload[0]) {
    return null;
  }

  const data = payload[0].payload;
  
  return (
    <div className="chart-tooltip">
      <div className="tooltip-token">"{data.token}"</div>
      <div className="tooltip-stats">
        <div className="tooltip-row">
          <span className="tooltip-label">Probability:</span>
          <span className="tooltip-value">{formatProbability(data.probability)}</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Log prob:</span>
          <span className="tooltip-value">{data.logprob.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom X-axis tick to show truncated tokens
 */
const CustomXAxisTick: React.FC<CustomXAxisTickProps> = ({ x, y, payload }) => {
  if (!payload) return null;
  
  const token = payload.value;
  // Truncate long tokens and add ellipsis
  const displayToken = token.length > 8 ? `${token.slice(0, 7)}…` : token;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        className="chart-x-tick"
        fill="var(--color-text-secondary)"
        fontSize={11}
      >
        {displayToken}
      </text>
    </g>
  );
};

export const ProbabilityChart: React.FC<ProbabilityChartProps> = ({
  data,
  temperature,
  loading = false,
  selectedToken,
}) => {
  // Transform data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((item) => ({
      token: item.token,
      probability: item.probability,
      displayProbability: item.probability * 100,
      logprob: item.logprob,
    }));
  }, [data]);

  // Get bar color based on temperature
  const barColor = useMemo(() => getTemperatureColor(temperature), [temperature]);

  // Generate gradient colors for bars (higher prob = more saturated)
  const getBarColor = (probability: number): string => {
    const baseColor = getTemperatureColor(temperature);
    // Fade out lower probability bars
    const opacity = 0.4 + (probability * 0.6);
    
    // Parse RGB and apply opacity effect by mixing with background
    const match = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return baseColor;
  };

  if (loading) {
    return (
      <div className="probability-chart loading">
        <div className="chart-skeleton">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-bar"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className="loading-text">Fetching probabilities...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="probability-chart empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Enter a prompt and adjust temperature to see token probabilities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="probability-chart">
      {selectedToken && (
        <div className="selected-token-banner">
          <span className="selected-token-label">Value selected by model</span>
          <span className="selected-token-value">{selectedToken}</span>
        </div>
      )}
      <div className="chart-header">
        <h3 className="chart-title">Possible token probabilities</h3>
        <span className="chart-subtitle">
          Top {data.length} predicted tokens
        </span>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            <XAxis
              dataKey="token"
              tick={<CustomXAxisTick />}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.3 }}
            />
            <Bar
              dataKey="displayProbability"
              radius={[4, 4, 0, 0]}
              animationDuration={BAR_ANIMATION_DURATION}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.probability)}
                  stroke={barColor}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProbabilityChart;
