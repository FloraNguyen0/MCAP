import hre, { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    // Deploy Meetcap
    const MeetcapTimeLock = await hre.ethers.getContractFactory('MeetcapTimeLock');
    const meetcapTimeLock = await MeetcapTimeLock.deploy(...);
    await meetcapTimeLock.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to network', networkName);
    console.log('Meetcap timelock deployed to:', meetcapTimeLock.address);
    console.log("Deploying contracts with the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


