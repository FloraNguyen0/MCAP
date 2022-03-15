import { ethers } from 'hardhat';

async function main () {
  // Retrieve accounts from the local node
const accounts = await ethers.provider.listAccounts();
// console.log(accounts);

// Set up an ethers contract, representing our deployed Meetcap instance
const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const Meetcap = await ethers.getContractFactory('Meetcap');
const meetcap = await Meetcap.attach(address);
const name = await meetcap.name();
console.log(name.toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });