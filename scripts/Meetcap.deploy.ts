import hre, { ethers } from 'hardhat';


async function main() {
    const [deployer] = await ethers.getSigners();
    // Deploy Meetcap
    const Meetcap = await hre.ethers.getContractFactory('Meetcap');
    const meetcap = await Meetcap.deploy();
    await meetcap.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to network', networkName);
    console.log('Meetcap tokens deployed to:', meetcap.address);
    console.log("Deploying contracts with the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


