import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { daysToSeconds, EthUtils } from '../../../utils/EthUtils';


async function main() {
    const [deployer] = await ethers.getSigners();

    const now = await EthUtils.latestBlockTimestamp();
    const ecosystemAllocation = BigNumber.
        from(2_000_000_000).mul(BigNumber.from(10).pow(18));
    const ecosystemLockDurations = Array(31).fill(daysToSeconds(180)).
        map((cliff, i) => cliff + daysToSeconds(30) * i);
    const ecosystemReleasePercents = [0].
        concat(Array(5).fill(5)).concat(Array(25).fill(3));

    // Deploy EcosystemTimeLock
    const EcosystemTimeLock = await hre.ethers.getContractFactory('EcosystemTimeLock');
    const ecosystemTimeLock = await EcosystemTimeLock.deploy(
        process.env.ECOSYSTEM_ADDRESS as string,
        process.env.MEETCAP_ADDRESS as string,
        ecosystemAllocation,
        ecosystemLockDurations,
        ecosystemReleasePercents,
        now
    );
    await ecosystemTimeLock.deployed();

    // transfer tokens from the deployer to TimeLock
    const meetcap = await hre.ethers.getContractAt('Meetcap', process.env.MEETCAP_ADDRESS as string)
    await meetcap.transfer(ecosystemTimeLock.address, ecosystemAllocation);

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Ecosystem timelock deployed to the address:', ecosystemTimeLock.address);
    console.log("Deploying contracts by the account:", deployer.address);
    console.log('Ecosystem start time:', now);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


