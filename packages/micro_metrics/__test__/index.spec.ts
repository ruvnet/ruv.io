import MetricsCollector, {
  CounterMetric,
  GaugeMetric,
  HistogramStats,
  MetricsReport,
} from '../src/index';

describe('Metrics Collector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  afterEach(() => {
    collector.clearAll();
  });

  // ============ Counter Tests ============

  describe('Counters', () => {
    it('should create a new metrics collector', () => {
      expect(collector).toBeDefined();
    });

    it('should increment counter by 1', () => {
      collector.incrementCounter('requests');
      expect(collector.getCounter('requests')).toBe(1);
    });

    it('should increment counter by custom value', () => {
      collector.incrementCounter('events', 5);
      expect(collector.getCounter('events')).toBe(5);
    });

    it('should accumulate counter increments', () => {
      collector.incrementCounter('total', 2);
      collector.incrementCounter('total', 3);
      expect(collector.getCounter('total')).toBe(5);
    });

    it('should handle multiple counters', () => {
      collector.incrementCounter('requests', 1);
      collector.incrementCounter('errors', 2);
      collector.incrementCounter('warnings', 1);

      expect(collector.getCounter('requests')).toBe(1);
      expect(collector.getCounter('errors')).toBe(2);
      expect(collector.getCounter('warnings')).toBe(1);
    });

    it('should reset counter to 0', () => {
      collector.incrementCounter('test', 10);
      expect(collector.getCounter('test')).toBe(10);
      collector.resetCounter('test');
      expect(collector.getCounter('test')).toBe(0);
    });

    it('should return 0 for non-existent counter', () => {
      expect(collector.getCounter('nonexistent')).toBe(0);
    });

    it('should get all counters', () => {
      collector.incrementCounter('counter1', 5);
      collector.incrementCounter('counter2', 10);

      const counters = collector.getAllCounters();
      expect(counters.length).toBeGreaterThanOrEqual(2);
      expect(counters.some((c: CounterMetric) => c.name === 'counter1' && c.value === 5)).toBe(true);
      expect(counters.some((c: CounterMetric) => c.name === 'counter2' && c.value === 10)).toBe(true);
    });

    it('should handle large counter values', () => {
      collector.incrementCounter('bigcount', 1000000);
      expect(collector.getCounter('bigcount')).toBe(1000000);
    });
  });

  // ============ Gauge Tests ============

  describe('Gauges', () => {
    it('should set gauge value', () => {
      collector.setGauge('temperature', 72.5);
      expect(collector.getGauge('temperature')).toBe(72.5);
    });

    it('should overwrite gauge value', () => {
      collector.setGauge('memory', 100);
      expect(collector.getGauge('memory')).toBe(100);
      collector.setGauge('memory', 250);
      expect(collector.getGauge('memory')).toBe(250);
    });

    it('should increment gauge', () => {
      collector.setGauge('active_connections', 10);
      collector.incrementGauge('active_connections', 5);
      expect(collector.getGauge('active_connections')).toBe(15);
    });

    it('should decrement gauge', () => {
      collector.setGauge('queue_size', 100);
      collector.decrementGauge('queue_size', 30);
      expect(collector.getGauge('queue_size')).toBe(70);
    });

    it('should handle negative gauge values', () => {
      collector.setGauge('temperature', -5.5);
      expect(collector.getGauge('temperature')).toBe(-5.5);
    });

    it('should handle fractional gauge values', () => {
      collector.setGauge('cpu_usage', 45.67);
      expect(collector.getGauge('cpu_usage')).toBeCloseTo(45.67, 2);
    });

    it('should return 0 for non-existent gauge', () => {
      expect(collector.getGauge('nonexistent')).toBe(0);
    });

    it('should get all gauges', () => {
      collector.setGauge('gauge1', 10.5);
      collector.setGauge('gauge2', 20.3);

      const gauges = collector.getAllGauges();
      expect(gauges.length).toBeGreaterThanOrEqual(2);
      expect(gauges.some((g: GaugeMetric) => g.name === 'gauge1')).toBe(true);
      expect(gauges.some((g: GaugeMetric) => g.name === 'gauge2')).toBe(true);
    });

    it('should support multiple increments on gauge', () => {
      collector.setGauge('value', 0);
      collector.incrementGauge('value', 1);
      collector.incrementGauge('value', 2);
      collector.incrementGauge('value', 3);
      expect(collector.getGauge('value')).toBe(6);
    });

    it('should support multiple decrements on gauge', () => {
      collector.setGauge('value', 100);
      collector.decrementGauge('value', 10);
      collector.decrementGauge('value', 20);
      collector.decrementGauge('value', 15);
      expect(collector.getGauge('value')).toBe(55);
    });
  });

  // ============ Histogram Tests ============

  describe('Histograms', () => {
    it('should record histogram values', () => {
      collector.recordHistogram('response_time', 100);
      const stats = collector.getHistogramStats('response_time');
      expect(stats.count).toBe(1);
      expect(stats.sum).toBe(100);
    });

    it('should track multiple histogram values', () => {
      collector.recordHistogram('request_size', 50);
      collector.recordHistogram('request_size', 75);
      collector.recordHistogram('request_size', 100);

      const stats = collector.getHistogramStats('request_size');
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(225);
    });

    it('should calculate min and max', () => {
      collector.recordHistogram('latency', 10);
      collector.recordHistogram('latency', 50);
      collector.recordHistogram('latency', 30);

      const stats = collector.getHistogramStats('latency');
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
    });

    it('should calculate average', () => {
      collector.recordHistogram('values', 10);
      collector.recordHistogram('values', 20);
      collector.recordHistogram('values', 30);

      const stats = collector.getHistogramStats('values');
      expect(stats.average).toBe(20);
    });

    it('should calculate percentiles', () => {
      // Record values 1-100
      for (let i = 1; i <= 100; i++) {
        collector.recordHistogram('percentile_test', i);
      }

      const stats = collector.getHistogramStats('percentile_test');
      expect(stats.p50).toBeGreaterThan(0);
      expect(stats.p95).toBeGreaterThan(stats.p50);
      expect(stats.p99).toBeGreaterThan(stats.p95);
    });

    it('should handle single value histogram', () => {
      collector.recordHistogram('single', 42);
      const stats = collector.getHistogramStats('single');
      expect(stats.count).toBe(1);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.average).toBe(42);
    });

    it('should handle floating point histogram values', () => {
      collector.recordHistogram('floats', 1.5);
      collector.recordHistogram('floats', 2.7);
      collector.recordHistogram('floats', 3.2);

      const stats = collector.getHistogramStats('floats');
      expect(stats.sum).toBeCloseTo(7.4, 1);
    });
  });

  // ============ Reporting Tests ============

  describe('Reporting', () => {
    it('should generate empty report', () => {
      const report = collector.generateReport();
      expect(report).toBeDefined();
      expect(report.counters).toEqual([]);
      expect(report.gauges).toEqual([]);
      expect(report.histograms).toEqual([]);
      expect(report.total_metrics).toBe(0);
    });

    it('should generate report with counters', () => {
      collector.incrementCounter('calls', 42);
      const report = collector.generateReport();

      expect(report.counters.length).toBe(1);
      expect(report.counters[0].name).toBe('calls');
      expect(report.counters[0].value).toBe(42);
    });

    it('should generate report with gauges', () => {
      collector.setGauge('cpu', 75.5);
      const report = collector.generateReport();

      expect(report.gauges.length).toBe(1);
      expect(report.gauges[0].name).toBe('cpu');
      expect(report.gauges[0].value).toBe(75.5);
    });

    it('should generate report with histograms', () => {
      collector.recordHistogram('timing', 100);
      collector.recordHistogram('timing', 200);

      const report = collector.generateReport();
      expect(report.histograms.length).toBe(1);
      expect(report.histograms[0].name).toBe('timing');
      expect(report.histograms[0].count).toBe(2);
    });

    it('should generate comprehensive report', () => {
      collector.incrementCounter('requests', 100);
      collector.setGauge('memory', 512.5);
      collector.recordHistogram('response_time', 50);

      const report = collector.generateReport();
      expect(report.total_metrics).toBe(3);
      expect(report.counters.length).toBe(1);
      expect(report.gauges.length).toBe(1);
      expect(report.histograms.length).toBe(1);
    });

    it('should include timestamp in report', () => {
      collector.incrementCounter('test', 1);
      const report = collector.generateReport();
      expect(report.generated_at).toBeGreaterThan(0);
    });
  });

  // ============ Management Tests ============

  describe('Metrics Management', () => {
    it('should count metrics', () => {
      collector.incrementCounter('counter', 1);
      collector.setGauge('gauge', 1);
      collector.recordHistogram('histogram', 1);

      expect(collector.countMetrics()).toBe(3);
    });

    it('should clear all metrics', () => {
      collector.incrementCounter('test', 10);
      collector.setGauge('test_gauge', 20);
      expect(collector.countMetrics()).toBeGreaterThan(0);

      collector.clearAll();
      expect(collector.countMetrics()).toBe(0);
      expect(collector.getCounter('test')).toBe(0);
      expect(collector.getGauge('test_gauge')).toBe(0);
    });

    it('should handle empty metrics collection', () => {
      collector.clearAll();
      expect(collector.countMetrics()).toBe(0);
      const report = collector.generateReport();
      expect(report.total_metrics).toBe(0);
    });
  });

  // ============ Integration Tests ============

  describe('Integration Tests', () => {
    it('should handle mixed metric operations', () => {
      // Simulate a microservice request lifecycle
      collector.incrementCounter('http_requests_total', 1);
      collector.incrementGauge('active_requests', 1);
      collector.recordHistogram('request_duration_ms', 125);

      collector.setGauge('last_request_size', 2048);
      collector.decrementGauge('active_requests', 1);

      const report = collector.generateReport();
      expect(report.total_metrics).toBe(4); // 1 counter + 2 gauges + 1 histogram
    });

    it('should persist metrics across queries', () => {
      collector.incrementCounter('persistent', 5);
      const val1 = collector.getCounter('persistent');
      collector.incrementCounter('persistent', 3);
      const val2 = collector.getCounter('persistent');

      expect(val1).toBe(5);
      expect(val2).toBe(8);
    });

    it('should support metric name patterns', () => {
      collector.incrementCounter('app.requests.total', 1);
      collector.setGauge('app.memory.usage', 512);
      collector.recordHistogram('app.response.time', 100);

      expect(collector.getCounter('app.requests.total')).toBe(1);
      expect(collector.getGauge('app.memory.usage')).toBe(512);

      const stats = collector.getHistogramStats('app.response.time');
      expect(stats.count).toBe(1);
    });

    it('should handle rapid metric updates', () => {
      for (let i = 0; i < 100; i++) {
        collector.incrementCounter('rapid_counter', 1);
        collector.recordHistogram('rapid_histogram', Math.random() * 100);
      }

      expect(collector.getCounter('rapid_counter')).toBe(100);
      const stats = collector.getHistogramStats('rapid_histogram');
      expect(stats.count).toBe(100);
    });

    it('should handle complex workflow simulation', () => {
      // Simulate request processing with metrics collection
      for (let i = 0; i < 10; i++) {
        collector.incrementCounter('requests.total', 1);
        const processingTime = Math.random() * 500;
        collector.recordHistogram('response.time.ms', processingTime);

        if (i % 2 === 0) {
          collector.recordHistogram('cache.hits', 1);
        } else {
          collector.recordHistogram('cache.misses', 1);
        }
      }

      const report = collector.generateReport();
      expect(report.total_metrics).toBeGreaterThan(0);
      expect(report.counters.length).toBeGreaterThan(0);
      expect(report.histograms.length).toBeGreaterThan(0);
    });
  });

  // ============ Advanced Metrics Tests ============

  describe('Advanced Metrics Operations', () => {
    it('should track multiple histogram measurements accurately', () => {
      const values = [100, 200, 150, 300, 250, 175, 225];
      values.forEach(v => collector.recordHistogram('measurements', v));

      const stats = collector.getHistogramStats('measurements');
      expect(stats.count).toBe(values.length);
      expect(stats.sum).toBeCloseTo(1400, 0);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
    });

    it('should handle zero values in histogram', () => {
      collector.recordHistogram('zeros', 0);
      collector.recordHistogram('zeros', 0);
      collector.recordHistogram('zeros', 0);

      const stats = collector.getHistogramStats('zeros');
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.average).toBe(0);
    });

    it('should calculate percentiles accurately', () => {
      // Add 10 values: 10, 20, 30, ..., 100
      for (let i = 1; i <= 10; i++) {
        collector.recordHistogram('percentile_values', i * 10);
      }

      const stats = collector.getHistogramStats('percentile_values');
      expect(stats.p50).toBeGreaterThanOrEqual(stats.min);
      expect(stats.p95).toBeGreaterThanOrEqual(stats.p50);
      expect(stats.p99).toBeGreaterThanOrEqual(stats.p95);
      expect(stats.p99).toBeLessThanOrEqual(stats.max);
    });

    it('should handle very large counter values', () => {
      collector.incrementCounter('large_counter', 999999999);
      expect(collector.getCounter('large_counter')).toBe(999999999);

      collector.incrementCounter('large_counter', 1);
      expect(collector.getCounter('large_counter')).toBe(1000000000);
    });

    it('should track separate metrics independently', () => {
      collector.incrementCounter('metric_a', 10);
      collector.incrementCounter('metric_b', 20);
      collector.incrementCounter('metric_c', 30);

      expect(collector.getCounter('metric_a')).toBe(10);
      expect(collector.getCounter('metric_b')).toBe(20);
      expect(collector.getCounter('metric_c')).toBe(30);
    });

    it('should handle mixed gauge operations', () => {
      collector.setGauge('balance', 1000);
      collector.decrementGauge('balance', 250);
      collector.incrementGauge('balance', 100);
      collector.decrementGauge('balance', 75);

      expect(collector.getGauge('balance')).toBe(775);
    });

    it('should reset individual metrics', () => {
      collector.incrementCounter('counter1', 50);
      collector.incrementCounter('counter2', 75);

      collector.resetCounter('counter1');

      expect(collector.getCounter('counter1')).toBe(0);
      expect(collector.getCounter('counter2')).toBe(75);
    });

    it('should maintain metric isolation', () => {
      const metrics = ['http.requests', 'db.queries', 'cache.ops', 'memory.allocations'];

      metrics.forEach((name, index) => {
        collector.incrementCounter(name, index + 1);
      });

      metrics.forEach((name, index) => {
        expect(collector.getCounter(name)).toBe(index + 1);
      });
    });

    it('should report accurate timestamps', () => {
      const beforeTime = Date.now();
      collector.incrementCounter('timestamped_counter', 1);
      const afterTime = Date.now();

      const report = collector.generateReport();
      expect(report.generated_at).toBeGreaterThanOrEqual(beforeTime);
      expect(report.generated_at).toBeLessThanOrEqual(afterTime + 1000); // Allow 1s margin
    });

    it('should handle metric name variations', () => {
      const names = [
        'simple',
        'with_underscore',
        'with-dash',
        'camelCase',
        'PascalCase',
        'with123numbers',
        'http.get.requests',
        'db_query_time_ms'
      ];

      names.forEach(name => {
        collector.incrementCounter(name, 1);
      });

      names.forEach(name => {
        expect(collector.getCounter(name)).toBe(1);
      });
    });

    it('should handle rapid sequential metric updates', () => {
      for (let i = 0; i < 50; i++) {
        collector.incrementCounter('seq_counter', 1);
        if (i % 2 === 0) {
          collector.recordHistogram('seq_histogram', Math.random() * 100);
        }
      }

      expect(collector.getCounter('seq_counter')).toBe(50);
      const stats = collector.getHistogramStats('seq_histogram');
      expect(stats.count).toBe(25);
    });

    it('should handle gauge boundary values', () => {
      collector.setGauge('max_value', Number.MAX_SAFE_INTEGER);
      expect(collector.getGauge('max_value')).toBe(Number.MAX_SAFE_INTEGER);

      collector.setGauge('min_value', Number.MIN_SAFE_INTEGER);
      expect(collector.getGauge('min_value')).toBe(Number.MIN_SAFE_INTEGER);

      collector.setGauge('fractional', 0.123456789);
      expect(collector.getGauge('fractional')).toBeCloseTo(0.123456789, 5);
    });

    it('should clear all metrics without side effects', () => {
      collector.incrementCounter('test1', 100);
      collector.setGauge('test2', 50);
      collector.recordHistogram('test3', 25);

      expect(collector.countMetrics()).toBe(3);

      collector.clearAll();

      expect(collector.countMetrics()).toBe(0);
      expect(collector.getCounter('test1')).toBe(0);
      expect(collector.getGauge('test2')).toBe(0);
    });

    it('should handle empty get operations gracefully', () => {
      collector.clearAll();

      expect(collector.getCounter('nonexistent')).toBe(0);
      expect(collector.getGauge('nonexistent')).toBe(0);
      expect(collector.getAllCounters()).toEqual([]);
      expect(collector.getAllGauges()).toEqual([]);
    });
  });

  // ============ Performance Tests ============

  describe('Performance and Stress Tests', () => {
    it('should handle 100 concurrent metric increments', () => {
      for (let i = 0; i < 100; i++) {
        collector.incrementCounter('stress_test', 1);
      }

      expect(collector.getCounter('stress_test')).toBe(100);
    });

    it('should handle histogram with many values', () => {
      for (let i = 0; i < 200; i++) {
        collector.recordHistogram('large_histogram', Math.random() * 1000);
      }

      const stats = collector.getHistogramStats('large_histogram');
      expect(stats.count).toBe(200);
      expect(stats.sum).toBeGreaterThan(0);
    });

    it('should generate report with many metrics', () => {
      for (let i = 0; i < 10; i++) {
        collector.incrementCounter(`counter_${i}`, 1);
        collector.setGauge(`gauge_${i}`, i * 10);
        collector.recordHistogram(`histogram_${i}`, i * 100);
      }

      const report = collector.generateReport();
      expect(report.total_metrics).toBe(30);
      expect(report.counters.length).toBe(10);
      expect(report.gauges.length).toBe(10);
      expect(report.histograms.length).toBe(10);
    });
  });
});
