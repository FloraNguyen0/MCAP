```shell
npx hardhat test
npx hardhat compile
// start a new Ethereum RPC server locally on port 8545 (local Ethereum network)
npx hardhat node
npx hardhat run --network matic_testnet <file location, e.g. scripts/deploy.ts>
npx hardhat deploy --network matic_testnet --tag <name of tag> [args...]
node <file location, e.g. scripts/deploy.ts>
npx hardhat verify --network matic_testnet <deployed contract address> <constructor arguments>
npx hardhat clean
npx hardhat accounts
npx hardhat help
```
