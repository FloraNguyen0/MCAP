import hre, { ethers } from 'hardhat';
import 'dotenv/config'


async function main() {
    const [deployer] = await ethers.getSigners();

    // Deploy MeetcapPresale
    const MeetcapPresale = await hre.ethers.getContractFactory('MeetcapPresale');
    // Change to the real meetcap address when deploying to mainnet
    const meetcapPresale = await MeetcapPresale.deploy(1000, deployer.address, '0x4C041C5e373E110EF026Edf04e388469435A66C1');
    await meetcapPresale.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Meetcap presale deployed to the address:', meetcapPresale.address);
    console.log("Deploying contracts by the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


