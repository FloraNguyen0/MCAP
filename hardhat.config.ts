import { task } from 'hardhat/config';
import 'dotenv/config'
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-solhint';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter"
import 'solidity-coverage';
import '@openzeppelin/hardhat-upgrades'

// The configuration file is always executed on startup,
// before anything else happens

// This is a sample Hardhat task.
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


// You need to export an object to set up config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// Using hardhat network only for testing,
// change to matic_testnet when deploying.
module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.9",
    settings: {
      evmVersion: "constantinople",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true
  },
  etherscan: {
    apiKey:
      process.env.TEST_POLYGONSCAN_API_KEY
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      network: {
        accounts: {
        }
      }
    },
    matic_testnet: {
      url: process.env.TEST_ALCHEMY_URL,
      chainId: 80001,
      accounts: [process.env.TEST_DEPLOYER_PRIVATE_KEY],
    },
    matic_mainnet: {
      url: 'https://polygon-rpc.com/',
      chainId: 137,
      accounts: [process.env.TEST_DEPLOYER_PRIVATE_KEY],
    },
  },
};
