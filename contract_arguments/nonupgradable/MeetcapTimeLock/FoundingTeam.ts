import { daysToSeconds, } from '../../../utils/EthUtils';
import 'dotenv/config'
import { BigNumber } from 'ethers';


const foundingTeamAllocation = BigNumber.
    from(1_900_000_000).mul(BigNumber.from(10).pow(18));
const foundingTeamLockDurations = Array(31).fill(daysToSeconds(180)).
    map((cliff, i) => cliff + daysToSeconds(30) * i);
const foundingTeamReleasePercents = [0].
    concat(Array(5).fill(5)).concat(Array(25).fill(3));

module.exports = [
    process.env.FOUNDING_TEAM_ADDRESS as string,
    process.env.MEETCAP_ADDRESS as string,
    foundingTeamAllocation,
    foundingTeamLockDurations,
    foundingTeamReleasePercents,
    1651231656
]
