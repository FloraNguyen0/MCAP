import hre, { ethers } from 'hardhat';
import 'dotenv/config'


async function main() {
    const meetcapAddress = '0x0681FAF2048B3476c3dDa8Cce284F226Bf700F2B';
    const [deployer] = await ethers.getSigners();

    // Deploy MeetcapPresale
    const MeetcapPresale = await hre.ethers.getContractFactory('MeetcapPresale');
    // Change to the real meetcap address when deploying to mainnet
    const meetcapPresale = await MeetcapPresale.deploy(1500, meetcapAddress);
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


