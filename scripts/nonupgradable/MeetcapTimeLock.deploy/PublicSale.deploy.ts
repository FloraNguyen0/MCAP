import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { daysToSeconds, EthUtils } from '../../utils/EthUtils';


async function main() {
    const [deployer] = await ethers.getSigners();

    const now = await EthUtils.latestBlockTimestamp();
    const publicSaleAllocation = BigNumber.
        from(800_000_000).mul(BigNumber.from(10).pow(18));
    const publicSaleLockDurations = Array(5).fill(daysToSeconds(20)).
        map((cliff, i) => cliff * (i + 1));
    const publicSaleReleasePercents = Array(5).fill(20);

    // Deploy MeetcapTimeLock
    const MeetcapTimeLock = await hre.ethers.getContractFactory('MeetcapTimeLock');
    const meetcapTimeLock = await MeetcapTimeLock.deploy(
        process.env.PUBLIC_SALE_ADDRESS as string,
        process.env.MEETCAP_ADDRESS as string,
        publicSaleAllocation,
        publicSaleLockDurations,
        publicSaleReleasePercents,
        now
    );
    await meetcapTimeLock.deployed();


    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Meetcap timelock deployed to the address:', meetcapTimeLock.address);
    console.log("Deploying contracts by the account:", deployer.address);
    console.log('Public sale start time:', now);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


