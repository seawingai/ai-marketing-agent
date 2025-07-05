import { PinoPlugin, logger } from './pino-plugin';

/**
 * Example demonstrating the usage of PinoPlugin
 * 
 * This example shows:
 * - Creating custom logger instances
 * - Using the default logger
 * - Different log levels and methods
 * - Timing operations
 * - Error handling
 * - Structured logging
 */

/**
 * Example 1: Using the default logger
 */
export function example1DefaultLogger(): void {
  console.log('\n=== Example 1: Default Logger ===');
  logger.info('Application started');
  logger.warn('This is a warning message');
  logger.debug('Debug information');
  logger.success('Operation completed successfully');
}

/**
 * Example 2: Creating custom logger instances
 */
export function example2CustomLoggerInstances(): void {
  console.log('\n=== Example 2: Custom Logger Instances ===');
  const userService = new PinoPlugin('UserService');
  const authService = new PinoPlugin('AuthService');
  const databaseService = new PinoPlugin('DatabaseService');

  userService.info('User service initialized');
  authService.info('Authentication service started');
  databaseService.info('Database connection established');
}

/**
 * Example 3: Timing operations
 */
export function example3TimingOperations(): void {
  console.log('\n=== Example 3: Timing Operations ===');
  const userService = new PinoPlugin('UserService');
  const startTime = Date.now();

  // Simulate some work
  setTimeout(() => {
    const duration = userService.finished('User data processing completed', startTime);
    console.log(`Operation took ${duration} seconds`);
  }, 1000);
}

/**
 * Example 4: Different log levels with timing
 */
export function example4LogLevelsWithTiming(): void {
  console.log('\n=== Example 4: Log Levels with Timing ===');
  const userService = new PinoPlugin('UserService');
  const operationStart = Date.now();

  // Simulate a complex operation
  setTimeout(() => {
    userService.started('Processing user registration', operationStart);
    
    setTimeout(() => {
      userService.info('Validating user data', operationStart);
      
      setTimeout(() => {
        userService.success('User registration successful', operationStart);
      }, 500);
    }, 300);
  }, 200);
}

/**
 * Example 5: Error handling
 */
export function example5ErrorHandling(): void {
  console.log('\n=== Example 5: Error Handling ===');
  const databaseService = new PinoPlugin('DatabaseService');
  
  try {
    // Simulate an error
    throw new Error('Database connection failed');
  } catch (error) {
    databaseService.error('Failed to connect to database', error);
  }
}

/**
 * Example 6: Error without stack trace
 */
export function example6ErrorWithoutStackTrace(): void {
  console.log('\n=== Example 6: Error without Stack Trace ===');
  const authService = new PinoPlugin('AuthService');
  
  try {
    throw new Error('Configuration error');
  } catch (error) {
    authService.error('Authentication configuration failed', error, false);
  }
}

/**
 * Example 7: Failed operations
 */
export function example7FailedOperations(): void {
  console.log('\n=== Example 7: Failed Operations ===');
  const authService = new PinoPlugin('AuthService');
  const failedStart = Date.now();
  
  setTimeout(() => {
    authService.failed('Token validation failed', failedStart);
  }, 800);
}

/**
 * Example 8: Multiple services working together
 */
export function example8MultipleServices(): void {
  console.log('\n=== Example 8: Multiple Services ===');
  const userService = new PinoPlugin('UserService');
  const authService = new PinoPlugin('AuthService');
  const databaseService = new PinoPlugin('DatabaseService');
  const multiStart = Date.now();

  setTimeout(() => {
    userService.started('User authentication flow', multiStart);
    
    setTimeout(() => {
      authService.info('Validating credentials', multiStart);
      
      setTimeout(() => {
        databaseService.info('Storing session data', multiStart);
        
        setTimeout(() => {
          userService.success('Authentication flow completed', multiStart);
        }, 200);
      }, 300);
    }, 400);
  }, 100);
}

/**
 * Example 9: Structured logging (using the log2 methods)
 */
export function example9StructuredLogging(): void {
  console.log('\n=== Example 9: Structured Logging ===');
  
  const userData = {
    id: 12345,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  };

  logger.info2('User data received', userData);

  const performanceMetrics = {
    responseTime: 245,
    memoryUsage: '128MB',
    cpuUsage: '15%'
  };

  logger.debug2('Performance metrics', performanceMetrics);

  const errorContext = {
    errorCode: 'AUTH_001',
    userId: 12345,
    timestamp: new Date().toISOString(),
    requestId: 'req-abc-123'
  };

  logger.error2('Authentication error context', errorContext);
}

/**
 * Example 10: Long-running operation simulation
 */
export function example10LongRunningOperation(): void {
  console.log('\n=== Example 10: Long-running Operation ===');
  const userService = new PinoPlugin('UserService');
  const longOperationStart = Date.now();

  // Simulate a long-running task
  setTimeout(() => {
    userService.started('Data migration process', longOperationStart);
    
    setTimeout(() => {
      userService.info('Migrating user profiles', longOperationStart);
      
      setTimeout(() => {
        userService.info('Migrating user preferences', longOperationStart);
        
        setTimeout(() => {
          userService.info('Migrating user settings', longOperationStart);
          
          setTimeout(() => {
            userService.success('Data migration completed successfully', longOperationStart);
          }, 1000);
        }, 800);
      }, 600);
    }, 400);
  }, 200);
}

/**
 * Example 11: Environment-based logging
 */
export function example11EnvironmentBasedLogging(): void {
  console.log('\n=== Example 11: Environment-based Logging ===');
  const devLogger = new PinoPlugin('DevelopmentService');
  const prodLogger = new PinoPlugin('ProductionService');

  devLogger.debug('This debug message will show in development');
  prodLogger.info('This info message will show in production');
}

/**
 * Example 12: Log file demonstration
 */
export function example12LogFileDemonstration(): void {
  console.log('\n=== Example 12: Log Files ===');
  const fileLogger = new PinoPlugin('FileLogger');
  fileLogger.info('This message will be written to logs/FileLogger.log');
  fileLogger.warn('Warning message in log file');
  fileLogger.error('Error message in log file');
}

/**
 * Run all examples
 */
export async function runExamples(): Promise<void> {
  // example1DefaultLogger();
  example2CustomLoggerInstances();
  // example3TimingOperations();
  // example4LogLevelsWithTiming();
  // example5ErrorHandling();
  // example6ErrorWithoutStackTrace();
  // example7FailedOperations();
  // example8MultipleServices();
  // example9StructuredLogging();
  // example10LongRunningOperation();
  // example11EnvironmentBasedLogging();
  // example12LogFileDemonstration();
  
  console.log('\n=== Example Complete ===');
  console.log('Check the logs/ directory for log files');
  console.log('Each service will have its own log file (e.g., UserService.log, AuthService.log)');
}

