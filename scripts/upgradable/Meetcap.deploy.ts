import hre, { ethers, upgrades, } from 'hardhat';


async function main() {
    const [deployer] = await ethers.getSigners();
    // Deploy Meetcap
    const Meetcap = await hre.ethers.getContractFactory('Meetcap');
    const meetcap = await upgrades.deployProxy(Meetcap, [], { initializer: "initialize" });

    await meetcap.deployed();

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Meetcap tokens deployed to the address:', meetcap.address);
    console.log("Deploying contracts by the account:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


