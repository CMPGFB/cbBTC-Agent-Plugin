# cbBTC Agent Plugin

## Overview

`CBBTCAgentPlugin` is a Node.js library for interacting with the cbBTC (Coinbase Bitcoin) token on the Base blockchain. It provides methods for checking balances, transferring tokens, and approving token spending.

## Features

- Check cbBTC token balance for any address
- Transfer cbBTC tokens
- Approve token spending for a specific address
- Robust error handling
- Gas estimation and transaction management

## Prerequisites

- Node.js (v16.0.0 or later)
- An Ethereum wallet with private key
- Base blockchain RPC URL

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cbbtc-agent-plugin.git
cd cbbtc-agent-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Fill in your environment variables in the `.env` file.

## Usage

```javascript
const CBBTCAgentPlugin = require('./src/CBBTCAgentPlugin');
require('dotenv').config();

async function main() {
  try {
    // Initialize the plugin
    const plugin = new CBBTCAgentPlugin(
      process.env.PRIVATE_KEY, 
      process.env.BASE_RPC_URL
    );

    // Check balance
    const balance = await plugin.checkBalance('0x1234...');
    console.log('Balance:', balance);

    // Transfer tokens
    const txHash = await plugin.transferCbBTC(
      '0x5678...', 
      '0.1'  // Amount in cbBTC
    );
    console.log('Transfer TX Hash:', txHash);

    // Approve spending
    const approvalHash = await plugin.approveSpender(
      '0x9012...', 
      '1.0'  // Amount in cbBTC
    );
    console.log('Approval TX Hash:', approvalHash);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Environment Variables

- `PRIVATE_KEY`: Your Ethereum wallet's private key
- `BASE_RPC_URL`: RPC endpoint for the Base blockchain

## Error Handling

The plugin provides detailed error messages for:
- Invalid addresses
- Invalid token amounts
- Network or transaction errors

## Security Considerations

- Never expose your private key
- Use environment variables for sensitive information
- Keep your `.env` file private and out of version control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Christopher Perceptions - [Christopher@NoCodeClarity.com](mailto:Christopher@NoCodeClarity.com)

Project Link: [https://github.com/cmpgfb/cbbtc-agent-plugin](https://github.com/cmpgfb/cbbtc-agent-plugin)

Built during NoCodeHacking 2024