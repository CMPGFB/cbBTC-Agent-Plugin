const { ethers } = require('ethers');
const CBBTCAgentPlugin = require('../src/CBBTCAgentPlugin');

// Test Configuration
const TEST_CONFIG = {
  PRIVATE_KEY: '0x1234567890123456789012345678901234567890123456789012345678901234',
  RPC_URL: 'https://sepolia.base.org', // Use a testnet RPC
  ADDRESSES: {
    VALID_SENDER: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    VALID_RECIPIENT: '0x7A1D0b3E8Bbb8A46Cc2B6E9b6b2A2D50A7Cf5b5',
    INVALID_ADDRESS: 'invalid-address'
  },
  AMOUNTS: {
    VALID_TRANSFER: '1.5',
    INVALID_NEGATIVE: '-1.0',
    ZERO_AMOUNT: '0'
  }
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_ADDRESS: /Invalid Ethereum address/,
  INVALID_AMOUNT: /Invalid amount/,
  PRIVATE_KEY_REQUIRED: /PRIVATE_KEY must be set/,
  RPC_URL_REQUIRED: /BASE_RPC_URL must be set/
};

/**
 * Test Suite for CBBTCAgentPlugin
 */
describe('CBBTCAgentPlugin - Comprehensive Test Suite', () => {
  let plugin;
  let mockContract;

  // Utility function to create a mock contract
  const createMockContract = (balanceResponse = ethers.parseUnits('10', 18)) => ({
    balanceOf: jest.fn().mockResolvedValue(balanceResponse),
    transfer: jest.fn().mockImplementation((to, amount, options) => ({
      wait: jest.fn().mockResolvedValue({
        status: 1,
        transactionHash: '0x123456789abcdef'
      }),
      hash: '0x123456789abcdef'
    })),
    approve: jest.fn().mockImplementation((spender, amount) => ({
      wait: jest.fn().mockResolvedValue({
        status: 1,
        transactionHash: '0x987654321fedcba'
      }),
      hash: '0x987654321fedcba'
    }))
  });

  // Setup before each test
  beforeEach(() => {
    // Initialize plugin with test configuration
    plugin = new CBBTCAgentPlugin(TEST_CONFIG.PRIVATE_KEY, TEST_CONFIG.RPC_URL);
    
    // Create and inject mock contract
    mockContract = createMockContract();
    plugin.cbBTCContract = mockContract;
  });

  // Constructor Validation Tests
  describe('Constructor Validation', () => {
    it('should throw an error if private key is not provided', () => {
      expect(() => new CBBTCAgentPlugin(null, TEST_CONFIG.RPC_URL))
        .toThrow(ERROR_MESSAGES.PRIVATE_KEY_REQUIRED);
    });

    it('should throw an error if RPC URL is not provided', () => {
      expect(() => new CBBTCAgentPlugin(TEST_CONFIG.PRIVATE_KEY, null))
        .toThrow(ERROR_MESSAGES.RPC_URL_REQUIRED);
    });
  });

  // Balance Check Tests
  describe('Balance Checking', () => {
    it('should successfully retrieve balance for a valid address', async () => {
      const balance = await plugin.checkBalance(TEST_CONFIG.ADDRESSES.VALID_SENDER);
      
      // Verify contract method was called correctly
      expect(mockContract.balanceOf).toHaveBeenCalledWith(TEST_CONFIG.ADDRESSES.VALID_SENDER);
      
      // Check balance is correctly formatted
      expect(balance).toBe('10.0');
    });

    it('should throw an error for an invalid address', async () => {
      await expect(plugin.checkBalance(TEST_CONFIG.ADDRESSES.INVALID_ADDRESS))
        .rejects.toThrow(ERROR_MESSAGES.INVALID_ADDRESS);
    });
  });

  // Token Transfer Tests
  describe('Token Transfers', () => {
    it('should successfully transfer tokens', async () => {
      const txHash = await plugin.transferCbBTC(
        TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
        TEST_CONFIG.AMOUNTS.VALID_TRANSFER
      );
      
      // Verify contract method was called with correct parameters
      expect(mockContract.transfer).toHaveBeenCalledWith(
        TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
        ethers.parseUnits(TEST_CONFIG.AMOUNTS.VALID_TRANSFER, 18),
        expect.objectContaining({
          type: 2,
          gasLimit: expect.any(BigInt)
        })
      );
      
      // Verify transaction hash is returned
      expect(txHash).toBe('0x123456789abcdef');
    });

    it('should throw an error for invalid recipient address', async () => {
      await expect(
        plugin.transferCbBTC(TEST_CONFIG.ADDRESSES.INVALID_ADDRESS, TEST_CONFIG.AMOUNTS.VALID_TRANSFER)
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_ADDRESS);
    });

    it('should throw an error for invalid transfer amount', async () => {
      await expect(
        plugin.transferCbBTC(
          TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
          TEST_CONFIG.AMOUNTS.INVALID_NEGATIVE
        )
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_AMOUNT);
    });

    it('should throw an error for zero transfer amount', async () => {
      await expect(
        plugin.transferCbBTC(
          TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
          TEST_CONFIG.AMOUNTS.ZERO_AMOUNT
        )
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_AMOUNT);
    });
  });

  // Token Approval Tests
  describe('Token Approvals', () => {
    it('should successfully approve token spending', async () => {
      const txHash = await plugin.approveSpender(
        TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
        TEST_CONFIG.AMOUNTS.VALID_TRANSFER
      );
      
      // Verify contract method was called with correct parameters
      expect(mockContract.approve).toHaveBeenCalledWith(
        TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
        ethers.parseUnits(TEST_CONFIG.AMOUNTS.VALID_TRANSFER, 18),
        expect.objectContaining({
          type: 2
        })
      );
      
      // Verify transaction hash is returned
      expect(txHash).toBe('0x987654321fedcba');
    });

    it('should throw an error for invalid spender address', async () => {
      await expect(
        plugin.approveSpender(
          TEST_CONFIG.ADDRESSES.INVALID_ADDRESS, 
          TEST_CONFIG.AMOUNTS.VALID_TRANSFER
        )
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_ADDRESS);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate a network error
      mockContract.balanceOf.mockRejectedValue(new Error('Network connection failed'));
      
      await expect(
        plugin.checkBalance(TEST_CONFIG.ADDRESSES.VALID_SENDER)
      ).rejects.toThrow(/Error checking balance/);
    });

    it('should provide meaningful error messages', async () => {
      try {
        await plugin.transferCbBTC(
          TEST_CONFIG.ADDRESSES.INVALID_ADDRESS, 
          TEST_CONFIG.AMOUNTS.VALID_TRANSFER
        );
      } catch (error) {
        expect(error.message).toMatch(ERROR_MESSAGES.INVALID_ADDRESS);
      }
    });
  });

  // Performance and Limit Tests
  describe('Performance Considerations', () => {
    it('should handle large transfer amounts', async () => {
      const largeAmount = '1000000.0'; // Large but realistic amount
      const txHash = await plugin.transferCbBTC(
        TEST_CONFIG.ADDRESSES.VALID_RECIPIENT, 
        largeAmount
      );
      
      expect(txHash).toBeTruthy();
      expect(mockContract.transfer).toHaveBeenCalled();
    });
  });
});
