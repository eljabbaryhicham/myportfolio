'use client';

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterFactor: 0.3,
};

export function calculateRetryDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(2, attempt - 1),
    config.maxDelayMs
  );
  const jitter = delay * config.jitterFactor * Math.random();
  return Math.floor(delay + jitter);
}

export function shouldRetry(
  attempt: number,
  error: Error | unknown,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (attempt >= config.maxRetries) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Only block retries for truly non-retryable errors (client errors that won't succeed on retry)
  const nonRetryableErrors = [
    'Invalid server response',
    '401',  // Unauthorized - token issue
    '403',  // Forbidden - permission issue
    '413',  // Payload too large - won't succeed on retry
  ];

  // Allow retries for transient errors:
  // - Network errors (often transient)
  // - Timeouts (often transient, especially for large files)
  // - 5xx server errors (often transient)
  const isTransient = errorMessage.includes('Network error') || 
                      errorMessage.includes('timed out') || 
                      errorMessage.includes('500') || 
                      errorMessage.includes('502') || 
                      errorMessage.includes('503') || 
                      errorMessage.includes('504');

  if (isTransient) return true;

  return !nonRetryableErrors.some((e) => errorMessage.includes(e));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, delay: number, error: Error) => void
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries || !shouldRetry(attempt, error, config)) {
        throw errorObj;
      }

      const delay = calculateRetryDelay(attempt, config);
      if (onRetry) onRetry(attempt, delay, errorObj);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function getRetryState(attempt: number, maxRetries: number): 'pending' | 'retrying' | 'maxed' {
  if (attempt === 0) return 'pending';
  if (attempt >= maxRetries) return 'maxed';
  return 'retrying';
}