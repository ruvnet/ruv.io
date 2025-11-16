/**
 * @ruv.io/micro_metrics - High-performance metrics collection for microservices
 *
 * This module provides a MetricsCollector class for collecting and reporting
 * metrics in microservice architectures, with support for counters, histograms, and gauges.
 */

let native: any;

try {
  // Try to load the native module
  try {
    native = require('../index');
  } catch (e) {
    // Fallback: Try loading the platform-specific binary directly
    const platformName = getPlatformSpecificBinary();
    native = require(`../${platformName}`);
  }
} catch (e) {
  console.error('Failed to load native micro_metrics module. Build the project first.');
  throw e;
}

function getPlatformSpecificBinary(): string {
  const os = require('os');
  const arch = os.arch();
  const platform = os.platform();

  let triple = '';
  if (platform === 'linux') {
    triple = arch === 'x64' ? 'linux-x64-gnu' : `linux-${arch}-gnu`;
  } else if (platform === 'darwin') {
    triple = arch === 'x64' ? 'darwin-x64' : `darwin-${arch}`;
  } else if (platform === 'win32') {
    triple = arch === 'x64' ? 'win32-x64' : `win32-${arch}`;
  }

  return `micro_metrics.${triple}.node`;
}

/**
 * Counter metric data structure
 */
export interface CounterMetric {
  name: string;
  value: number;
  tags: Record<string, any>;
  timestamp: number;
}

/**
 * Histogram metric data structure
 */
export interface HistogramMetric {
  name: string;
  buckets: Record<string, number>;
  count: number;
  sum: number;
  min: number;
  max: number;
  tags: Record<string, any>;
  timestamp: number;
}

/**
 * Gauge metric data structure
 */
export interface GaugeMetric {
  name: string;
  value: number;
  tags: Record<string, any>;
  timestamp: number;
}

/**
 * Histogram statistics
 */
export interface HistogramStats {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Metrics report
 */
export interface MetricsReport {
  counters: CounterMetric[];
  histograms: HistogramMetric[];
  gauges: GaugeMetric[];
  total_metrics: number;
  generated_at: number;
}

/**
 * High-performance metrics collector for microservices
 */
export class MetricsCollector {
  private native: any;

  /**
   * Create a new metrics collector
   */
  constructor() {
    this.native = new native.MetricsCollector();
  }

  /**
   * Increment a counter
   * @param name - Counter name
   * @param value - Value to increment by (default 1)
   */
  public incrementCounter(name: string, value: number = 1): void {
    this.native.incrementCounter(name, value);
  }

  /**
   * Get counter value
   * @param name - Counter name
   * @returns Counter value
   */
  public getCounter(name: string): number {
    return this.native.getCounter(name);
  }

  /**
   * Reset a counter to 0
   * @param name - Counter name
   */
  public resetCounter(name: string): void {
    this.native.resetCounter(name);
  }

  /**
   * Record a value in a histogram
   * @param name - Histogram name
   * @param value - Value to record
   */
  public recordHistogram(name: string, value: number): void {
    this.native.recordHistogram(name, value);
  }

  /**
   * Get histogram statistics
   * @param name - Histogram name
   * @returns Histogram statistics
   */
  public getHistogramStats(name: string): HistogramStats {
    const statsJson = this.native.getHistogramStats(name);
    return JSON.parse(statsJson);
  }

  /**
   * Set gauge value
   * @param name - Gauge name
   * @param value - Value to set
   */
  public setGauge(name: string, value: number): void {
    this.native.setGauge(name, value);
  }

  /**
   * Get gauge value
   * @param name - Gauge name
   * @returns Gauge value
   */
  public getGauge(name: string): number {
    return this.native.getGauge(name);
  }

  /**
   * Increment gauge value
   * @param name - Gauge name
   * @param delta - Value to increment by
   */
  public incrementGauge(name: string, delta: number): void {
    this.native.incrementGauge(name, delta);
  }

  /**
   * Decrement gauge value
   * @param name - Gauge name
   * @param delta - Value to decrement by
   */
  public decrementGauge(name: string, delta: number): void {
    this.native.decrementGauge(name, delta);
  }

  /**
   * Get all counters
   * @returns Array of counter metrics
   */
  public getAllCounters(): CounterMetric[] {
    const countersJson = this.native.getAllCounters();
    return JSON.parse(countersJson);
  }

  /**
   * Get all gauges
   * @returns Array of gauge metrics
   */
  public getAllGauges(): GaugeMetric[] {
    const gaugesJson = this.native.getAllGauges();
    return JSON.parse(gaugesJson);
  }

  /**
   * Generate a metrics report
   * @returns Metrics report
   */
  public generateReport(): MetricsReport {
    const reportJson = this.native.generateReport();
    return JSON.parse(reportJson);
  }

  /**
   * Clear all metrics
   */
  public clearAll(): void {
    this.native.clearAll();
  }

  /**
   * Count total metrics
   * @returns Total number of metrics
   */
  public countMetrics(): number {
    return this.native.countMetrics();
  }
}

export default MetricsCollector;
