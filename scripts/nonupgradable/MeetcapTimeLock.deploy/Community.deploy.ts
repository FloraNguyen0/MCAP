import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { daysToSeconds, EthUtils } from '../../../utils/EthUtils';


async function main() {
    const [deployer] = await ethers.getSigners();

    const now = await EthUtils.latestBlockTimestamp();
    const communityAllocation = BigNumber.
        from(800_000_000).mul(BigNumber.from(10).pow(18));
    const communityLockDurations = Array(31).fill(daysToSeconds(180)).
        map((cliff, i) => cliff + daysToSeconds(30) * i);
    const communityReleasePercents = [0].
        concat(Array(5).fill(5)).concat(Array(25).fill(3));

    // Deploy CommunityTimeLock
    const CommunityTimeLock = await hre.ethers.getContractFactory('CommunityTimeLock');
    const communityTimeLock = await CommunityTimeLock.deploy(
        process.env.COMMUNITY_ADDRESS as string,
        process.env.MEETCAP_ADDRESS as string,
        communityAllocation,
        communityLockDurations,
        communityReleasePercents,
        now
    );
    await communityTimeLock.deployed();

    // transfer tokens from the deployer to TimeLock
    const meetcap = await hre.ethers.getContractAt('Meetcap', process.env.MEETCAP_ADDRESS as string)
    await meetcap.transfer(communityTimeLock.address, communityAllocation);

    // Deployment data
    const networkName = hre.network.name;
    console.log('Deploying to the network:', networkName);
    console.log('Community timelock deployed to the address:', communityTimeLock.address);
    console.log("Deploying contracts by the account:", deployer.address);
    console.log('Community start time:', now);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });


