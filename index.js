const CBBTCAgentPlugin = require('./src/CBBTCAgentPlugin');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

/**
 * Configuration and Environment Management
 */
class ConfigManager {
  /**
   * Load environment variables with validation
   * @throws {Error} If required environment variables are missing
   */
  static loadConfig() {
    // Determine the environment
    const envFile = process.env.NODE_ENV 
      ? `.env.${process.env.NODE_ENV}` 
      : '.env';
    
    // Path to the environment file
    const envPath = path.resolve(process.cwd(), envFile);
    
    // Check if environment file exists
    if (!fs.existsSync(envPath)) {
      console.warn(`No environment file found at ${envPath}. Using default configuration.`);
    }
    
    // Load environment variables
    const result = dotenv.config({ 
      path: envPath,
      debug: process.env.DEBUG === 'true'
    });
    
    // Handle any errors in loading environment variables
    if (result.error) {
      console.error('Error loading environment variables:', result.error);
      throw result.error;
    }
    
    // Validate required environment variables
    this.validateConfig();
  }
  
  /**
   * Validate required configuration parameters
   * @throws {Error} If any required configuration is missing
   */
  static validateConfig() {
    const requiredVars = ['PRIVATE_KEY', 'BASE_RPC_URL'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
}

/**
 * Main application class
 */
class CBBTCAgentApp {
  constructor() {
    // Ensure configuration is loaded
    ConfigManager.loadConfig();
    
    // Initialize the plugin
    this.plugin = new CBBTCAgentPlugin(
      process.env.PRIVATE_KEY,
      process.env.BASE_RPC_URL
    );
  }
  
  /**
   * Perform a balance check operation
   * @param {string} address - Ethereum address to check
   * @returns {Promise<string>} - Balance of the address
   */
  async checkBalance(address) {
    try {
      return await this.plugin.checkBalance(address);
    } catch (error) {
      this.logError('Balance Check', error);
      throw error;
    }
  }
  
  /**
   * Perform a token transfer
   * @param {string} recipient - Recipient address
   * @param {string} amount - Amount to transfer
   * @returns {Promise<string>} - Transaction hash
   */
  async transferTokens(recipient, amount) {
    try {
      return await this.plugin.transferCbBTC(recipient, amount);
    } catch (error) {
      this.logError('Token Transfer', error);
      throw error;
    }
  }
  
  /**
   * Approve token spending
   * @param {string} spender - Spender address
   * @param {string} amount - Amount to approve
   * @returns {Promise<string>} - Transaction hash
   */
  async approveSpending(spender, amount) {
    try {
      return await this.plugin.approveSpender(spender, amount);
    } catch (error) {
      this.logError('Token Approval', error);
      throw error;
    }
  }
  
  /**
   * Centralized error logging method
   * @param {string} context - Context of the error
   * @param {Error} error - Error object
   * @private
   */
  logError(context, error) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${context} Error: ${error.message}\n`;
    
    // Log to console
    console.error(logEntry);
    
    // Optionally log to file (uncomment if needed)
    // this.writeErrorToFile(logEntry);
  }
  
  /**
   * Write error to log file (optional)
   * @param {string} logEntry - Log entry to write
   * @private
   */
  writeErrorToFile(logEntry) {
    const logDir = path.resolve(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    
    try {
      fs.appendFileSync(logFile, logEntry);
    } catch (writeError) {
      console.error('Could not write to log file:', writeError);
    }
  }
}

/**
 * Application entry point with error handling
 */
async function main() {
  try {
    // Create an instance of the application
    const app = new CBBTCAgentApp();
    
    // Example usage (remove or replace with actual logic)
    if (process.argv.length > 2) {
      switch (process.argv[2]) {
        case 'balance':
          if (!process.argv[3]) {
            throw new Error('Please provide an address to check balance');
          }
          const balance = await app.checkBalance(process.argv[3]);
          console.log(`Balance: ${balance} cbBTC`);
          break;
        
        case 'transfer':
          if (process.argv.length < 5) {
            throw new Error('Usage: node index.js transfer <recipient> <amount>');
          }
          const txHash = await app.transferTokens(process.argv[3], process.argv[4]);
          console.log(`Transfer TX Hash: ${txHash}`);
          break;
        
        case 'approve':
          if (process.argv.length < 5) {
            throw new Error('Usage: node index.js approve <spender> <amount>');
          }
          const approvalHash = await app.approveSpending(process.argv[3], process.argv[4]);
          console.log(`Approval TX Hash: ${approvalHash}`);
          break;
        
        default:
          console.log('Invalid command. Use: balance, transfer, or approve');
      }
    }
  } catch (error) {
    // Global error handler
    console.error('Application Error:', error.message);
    process.exit(1);
  }
}

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main();

module.exports = {
  CBBTCAgentApp,
  ConfigManager
};
