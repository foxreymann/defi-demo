const path = require("path");

// HD WALLET
const HDWalletProvider = require('@truffle/hdwallet-provider')
const mnemonic = process.env.BOTNOMIC

// LEDGER
const LedgerWalletProvider = require('@umaprotocol/truffle-ledger-provider');
const ledgerOptions = {
  networkId: 108,
  path: "44'/60'/0'/0",
  askConfirm: false,
  accountsLength: 1,
  accountsOffset: 0
};

module.exports = {
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/built-contracts/',
  compilers: {
    solc: {
      version: "0.8.3",
      settings: {
        // see the solidity docs for advice about optimization and evmversion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium" // Current EVM on ThunderCore is fixed to "byzantium"
      }
    }
  },
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      websockets: true,
      gasPrice: 1000000000,
      defaultEtherBalance: 9999
    },

    'thunder': {
      provider: new LedgerWalletProvider(ledgerOptions, "https://mainnet-rpc.thundercore.com"),
      network_id: 108,
      gasPrice: 1000000000,
      gas: 12000000  // 0.006 -> 0.012   0.1
    },
    'thunder-truffle': {
      provider: () => new HDWalletProvider({
        mnemonic: {
          phrase: mnemonic
        },
        providerOrUrl: "https://mainnet-rpc.thundercore.com",
        numberOfAddresses: 1,
        shareNonce: true,
      }),
      network_id: 108,
      gasPrice: 1000000000
    },
  }
}
