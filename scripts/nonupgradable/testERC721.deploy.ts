import hre, { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    const MeetcapNFT = await ethers.getContractFactory("MeetcapNFT");
    const meetcapNFT = await MeetcapNFT.deploy();
    await meetcapNFT.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Meetcap timelock deployed to the address:', meetcapNFT.address);
    console.log("Deploying contracts by the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });