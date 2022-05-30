```shell
npx hardhat compile
npx hardhat test
npx hardhat coverage [command-options]
# Starts a new Ethereum RPC server locally on port 8545 (local Ethereum network)
npx hardhat node
# Runs a user-defined script after compiling the project
npx hardhat run --network matic_testnet <file location, e.g. scripts/deploy.ts>
npx hardhat deploy --network matic_testnet --tag <name of tag> [args...]
node <file location, e.g. scripts/deploy.ts>
npx hardhat verify --network matic_testnet <deployed contract address> <constructor arguments>
# Clears the cache and deletes all artifacts
npx hardhat clean
npx hardhat accounts
npx hardhat help
npx hardhat coverage
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix

```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
