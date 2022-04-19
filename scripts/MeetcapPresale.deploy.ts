import hre, { ethers } from 'hardhat';


async function main() {
    const [deployer] = await ethers.getSigners();

    // Deploy MeetcapPresale
    const MeetcapPresale = await hre.ethers.getContractFactory('MeetcapPresale');
    const meetcapPresale = await MeetcapPresale.deploy(1000, deployer.address, meetcap.address);
    await meetcapPresale.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to network', networkName);
    console.log('Meetcap presale deployed to:', meetcapPresale.address);
    console.log("Deploying contracts with the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


