// utils/logger.ts
import Constants from 'expo-constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type AnalyticsType = 'warning' | 'error';

class Logger {
  static isDev: boolean = __DEV__;
  static isProduction: boolean = !__DEV__;
  
  /**
   * Debug level log - only in development
   */
  static debug(...args: unknown[]): void {
    if (this.isDev) {
      console.log('🐛 DEBUG:', ...args);
    }
  }
  
  /**
   * Info level log - only in development
   */
  static info(...args: unknown[]): void {
    if (this.isDev) {
      console.log('ℹ️ INFO:', ...args);
    }
  }
  
  /**
   * Warning level log - shows in dev, sends to analytics in prod
   */
  static warn(...args: unknown[]): void {
    if (this.isDev) {
      console.warn('⚠️ WARN:', ...args);
    } else {
      // Send to error tracking service in production
      this.sendToAnalytics('warning', args);
    }
  }
  
  /**
   * Error level log - always shows, sends to analytics in prod
   */
  static error(...args: unknown[]): void {
    // Always log errors
    console.error('❌ ERROR:', ...args);
    
    // Send to error tracking service in production
    if (this.isProduction) {
      this.sendToAnalytics('error', args);
    }
  }
  
  /**
   * Start a timer for performance tracking
   */
  static time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }
  
  /**
   * End a timer for performance tracking
   */
  static timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }
  
  /**
   * Group related logs together
   */
  static group(label: string, fn: () => void): void {
    if (this.isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  }
  
  /**
   * Send analytics data to tracking service
   * Override this method to integrate with your analytics provider
   */
  static sendToAnalytics(type: AnalyticsType, data: unknown[]): void {
    // Integrate with Sentry, Firebase Crashlytics, etc.
    // Example with Sentry:
    // Sentry.captureMessage(JSON.stringify(data), type);
    
    // Example with Firebase:
    // analytics.logEvent(type, { data: JSON.stringify(data) });
    
    // Optional: Add your implementation here
    console.log(`[Analytics] ${type}:`, data);
  }
  
  /**
   * Log network requests
   */
  static networkRequest(url: string, method: string, data?: unknown): void {
    if (this.isDev) {
      console.log(`🌐 ${method} ${url}`, data || '');
    }
  }
  
  /**
   * Log component lifecycle events
   */
  static componentLifecycle(componentName: string, lifecycle: string, props?: Record<string, unknown>): void {
    if (this.isDev) {
      console.log(`📱 ${componentName}.${lifecycle}`, props || '');
    }
  }
  
  /**
   * Log API responses
   */
  static apiResponse(endpoint: string, status: number, data?: unknown): void {
    if (this.isDev) {
      const emoji = status >= 400 ? '❌' : '✅';
      console.log(`${emoji} API ${endpoint} [${status}]`, data || '');
    }
  }
  
  /**
   * Log user actions for debugging
   */
  static userAction(action: string, metadata?: Record<string, unknown>): void {
    if (this.isDev) {
      console.log(`👤 USER ACTION: ${action}`, metadata || '');
    }
  }
  
  /**
   * Log Redux/State management actions (optional)
   */
  static stateChange(store: string, action: string, prevState?: unknown, nextState?: unknown): void {
    if (this.isDev) {
      console.group(`📦 ${store} - ${action}`);
      console.log('Previous:', prevState);
      console.log('Next:', nextState);
      console.groupEnd();
    }
  }
  
  /**
   * Create a namespaced logger for specific modules
   */
  static createNamespace(namespace: string): NamespacedLogger {
    return new NamespacedLogger(namespace);
  }
}

/**
 * Namespaced logger for organizing logs by module/feature
 */
class NamespacedLogger {
  constructor(private namespace: string) {}
  
  debug(...args: unknown[]): void {
    if (Logger.isDev) {
      console.log(`🐛 [${this.namespace}] DEBUG:`, ...args);
    }
  }
  
  info(...args: unknown[]): void {
    if (Logger.isDev) {
      console.log(`ℹ️ [${this.namespace}] INFO:`, ...args);
    }
  }
  
  warn(...args: unknown[]): void {
    if (Logger.isDev) {
      console.warn(`⚠️ [${this.namespace}] WARN:`, ...args);
    } else {
      Logger.sendToAnalytics('warning', [`[${this.namespace}]`, ...args]);
    }
  }
  
  error(...args: unknown[]): void {
    console.error(`❌ [${this.namespace}] ERROR:`, ...args);
    if (Logger.isProduction) {
      Logger.sendToAnalytics('error', [`[${this.namespace}]`, ...args]);
    }
  }
}

export default Logger;