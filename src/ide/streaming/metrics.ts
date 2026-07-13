/**
 * Metrics & Telemetry
 * 
 * Collects performance metrics and telemetry events from the streaming runtime.
 */

import type { RuntimePerformanceMetrics, TelemetryEvent, RuntimeNotification, RuntimeSeverity } from "./types";

export class MetricsCollector {
  private metrics: RuntimePerformanceMetrics = {
    latency: 0,
    promptBuildTime: 0,
    contextTime: 0,
    modelTime: 0,
    verificationTime: 0,
    patchTime: 0,
    streamingLatency: 0,
    eventsPerSecond: 0,
    tokensPerSecond: 0,
    filesPerSecond: 0,
    providerLatency: {},
  };

  private telemetry: TelemetryEvent[] = [];
  private notifications: RuntimeNotification[] = [];
  private eventCount = 0;
  private lastEventTime = Date.now();

  /**
   * Record a metric
   */
  recordMetric(metric: keyof RuntimePerformanceMetrics, value: number, provider?: string): void {
    if (metric === "providerLatency" && provider) {
      this.metrics.providerLatency[provider] = value;
    } else {
      const metrics = this.metrics as unknown as Record<string, number>;
      metrics[metric] = value;
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): RuntimePerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Add telemetry event
   */
  addTelemetry(metric: string, value: number, metadata: Record<string, unknown> = {}): TelemetryEvent {
    const event: TelemetryEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: metadata.sessionId as string || "default",
      metric,
      value,
      metadata,
    };

    this.telemetry.push(event);
    return event;
  }

  /**
   * Get telemetry
   */
  getTelemetry(): TelemetryEvent[] {
    return [...this.telemetry];
  }

  /**
   * Send notification
   */
  notify(type: string, title: string, message: string, severity: RuntimeSeverity = "info", metadata: Record<string, unknown> = {}): RuntimeNotification {
    const notification: RuntimeNotification = {
      id: this.generateId(),
      timestamp: Date.now(),
      type,
      title,
      message,
      severity,
      metadata,
    };

    this.notifications.push(notification);
    return notification;
  }

  /**
   * Get notifications
   */
  getNotifications(): RuntimeNotification[] {
    return [...this.notifications];
  }

  /**
   * Update throughput metrics
   */
  updateThroughputMetrics(tokens: number, files: number): void {
    const now = Date.now();
    const elapsed = (now - this.lastEventTime) / 1000;
    if (elapsed > 0) {
      this.metrics.tokensPerSecond = tokens / elapsed;
      this.metrics.filesPerSecond = files / elapsed;
      this.metrics.eventsPerSecond = this.eventCount / elapsed;
    }
    this.eventCount = 0;
    this.lastEventTime = now;
  }

  /**
   * Track event
   */
  trackEvent(): void {
    this.eventCount++;
  }

  /**
   * Get success/failure rate from telemetry
   */
  getRate(metric: string): number {
    const events = this.telemetry.filter(t => t.metric === metric);
    if (events.length === 0) return 0;
    const success = events.filter(t => t.value > 0).length;
    return success / events.length;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
