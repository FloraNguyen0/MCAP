import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { EthUtils, daysToSeconds } from '../utils/EthUtils';
import { Meetcap } from '../typechain-types/Meetcap';
import { MeetcapTimeLock } from '../typechain-types/MeetcapTimeLock'
import MeetcapArtifact from '../artifacts/contracts/token/Meetcap.sol/Meetcap.json';
import MeetcapTimeLockArtifact from '../artifacts/contracts/token/MeetcapTimeLock.sol/MeetcapTimeLock.json';

const { deployContract } = waffle;
const { BigNumber } = ethers;
const { expect } = chai;


describe('MeetcapTimeLock', function () {
  let meetcap: Meetcap;
  let meetcapTimeLock: MeetcapTimeLock;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let factory: SignerWithAddress;

  beforeEach(async function () {
    // await deployments.fixture(['token-time-lock', 'meetcap']);
    [owner, user, factory] = await ethers.getSigners();

    meetcap = (await deployContract(owner, MeetcapArtifact)) as Meetcap;
    meetcapTimeLock = (await deployContract(owner, MeetcapTimeLockArtifact)) as MeetcapTimeLock;
  });

  describe('register new lock', function () {
    it('new lock should be stored successfully', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        10,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 20, 20, 20],
        await EthUtils.latestBlockTimestamp()
      );
      const [
        userAddress,
        token,
        amount,
        releasedAmount,
        startDate,
        lockDurations,
        releasePercents,
        releaseDates,
        nextReleaseIdx,
        factoryAddress,
      ] = await meetcapTimeLock.lockData();

      expect(amount).to.equal(10);
      expect(lockDurations).to.deep.equal([
        daysToSeconds(1),
        daysToSeconds(2),
        daysToSeconds(3),
        daysToSeconds(4),
        daysToSeconds(5),
      ]);
      expect(releasePercents).to.deep.equal([20, 20, 20, 20, 20]);
      expect(nextReleaseIdx).to.equal(0);
      expect(releasedAmount).to.equal(0);
      expect(factoryAddress).to.equal(factory.address);
    });

    it('should revert when unlock percents and unlock dates length not match', async function () {
      await expect(
        meetcapTimeLock.initialize(
          factory.address,
          user.address,
          meetcap.address,
          10,
          [
            daysToSeconds(1),
            daysToSeconds(2),
            daysToSeconds(3),
            daysToSeconds(4),
            daysToSeconds(5),
          ],
          [20, 20, 20, 20],
          await EthUtils.latestBlockTimestamp()
        )
      ).to.revertedWith('MeetcapTimeLock: unlock length not match');
    });

    it('should revert when total unlock percents not 100', async function () {
      await expect(
        meetcapTimeLock.initialize(
          factory.address,
          user.address,
          meetcap.address,
          10,
          [
            daysToSeconds(1),
            daysToSeconds(2),
            daysToSeconds(3),
            daysToSeconds(4),
            daysToSeconds(5),
          ],
          [20, 20, 20, 20, 10],
          await EthUtils.latestBlockTimestamp()
        )
      ).to.revertedWith('MeetcapTimeLock: unlock percent not match 100');
    });

    it('should set factory correctly when initialize()', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        10,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 20, 20, 20],
        await EthUtils.latestBlockTimestamp()
      );

      expect(await meetcapTimeLock.factory()).to.equal(factory.address);
    });
  });


  describe('release locked tokens', function () {
    it('should release locked tokens to correct user when unlock conditions are met', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        BigNumber.from(100_000_000).mul(
          BigNumber.from(10).pow(BigNumber.from(await meetcap.decimals()))
        ),
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );
      await meetcap.transfer(
        meetcapTimeLock.address,
        BigNumber.from(100_000_000).mul(
          BigNumber.from(10).pow(BigNumber.from(await meetcap.decimals()))
        )
      );
      const decimals = await meetcap.decimals();

      // Release 1st phase
      ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await meetcapTimeLock.release();
      expect(await meetcap.balanceOf(user.address)).to.equal(
        BigNumber.from(20_000_000).mul(
          BigNumber.from(10).pow(BigNumber.from(decimals))
        )
      );

      // Release 2nd 3rd phase
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 2]);
      await meetcapTimeLock.release();
      expect(await meetcap.balanceOf(user.address)).to.equal(
        BigNumber.from(50_000_000).mul(
          BigNumber.from(10).pow(BigNumber.from(decimals))
        )
      );

      // Release remaining phase
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 2]);
      await meetcapTimeLock.release();
      expect(await meetcap.balanceOf(user.address)).to.equal(
        BigNumber.from(100_000_000).mul(
          BigNumber.from(10).pow(BigNumber.from(decimals))
        )
      );
    });

    it('should emit Release event with correct data', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        100,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );

      await meetcap.transfer(meetcapTimeLock.address, 100);

      const releaseDates = [
        (await EthUtils.latestBlockTimestamp()) + daysToSeconds(1),
        (await EthUtils.latestBlockTimestamp()) + daysToSeconds(5),
      ];

      // Move to 1st phase
      ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await expect(meetcapTimeLock.connect(user).release())
        .to.emit(meetcapTimeLock, 'Released')
        .withArgs(20, 20, 0, 0, releaseDates[0]);

      // Move to last phase
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 4]);
      await expect(meetcapTimeLock.connect(user).release())
        .to.emit(meetcapTimeLock, 'Released')
        .withArgs(80, 100, 1, 4, releaseDates[1]);
    });

    it('just to check what maximum gas that release all phases at a time', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        100,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );

      await meetcap.transfer(meetcapTimeLock.address, 100);

      ethers.provider.send('evm_increaseTime', [3600 * 24 * 10]);
      await meetcapTimeLock.release();

      expect(await meetcap.balanceOf(user.address)).to.equal(100);
    });

    it('should set release dates correct', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        100,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );

      await meetcap.transfer(meetcapTimeLock.address, 100);

      const originDate = await EthUtils.latestBlockTimestamp();
      const expectedReleaseDates = [
        originDate + daysToSeconds(1),
        originDate + daysToSeconds(5),
        originDate + daysToSeconds(5),
        originDate + daysToSeconds(5),
        originDate + daysToSeconds(5),
      ];

      // Move to 1st phase
      ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await meetcapTimeLock.connect(user).release();
      const [_1, _2, _3, _4, _5, _6, _7, releaseDates] =
        await meetcapTimeLock.lockData();
      expect(releaseDates[0]).to.equal(expectedReleaseDates[0]);

      // Move to last phase
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 4]);
      await meetcapTimeLock.connect(user).release();
      const [__1, __2, __3, __4, __5, __6, __7, releaseDates_2] =
        await meetcapTimeLock.lockData();
      expect(releaseDates_2[0]).to.equal(expectedReleaseDates[0]);
      expect(releaseDates_2[1]).to.equal(expectedReleaseDates[1]);
      expect(releaseDates_2[2]).to.equal(expectedReleaseDates[2]);
      expect(releaseDates_2[3]).to.equal(expectedReleaseDates[3]);
      expect(releaseDates_2[4]).to.equal(expectedReleaseDates[4]);
    });

    it(`should revert when does not meet next unlock phase requirements`, async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        10,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );

      await meetcap.transfer(meetcapTimeLock.address, 100);

      await expect(meetcapTimeLock.connect(user).release()).to.be.revertedWith(
        'MeetcapTimeLock: next phase unavailable'
      );

      // Release 1st phase
      ethers.provider.send('evm_increaseTime', [3600 * 24]);
      await meetcapTimeLock.connect(user).release();

      // Should revert if users try to release 2nd phase
      await expect(meetcapTimeLock.connect(user).release()).to.be.revertedWith(
        'MeetcapTimeLock: next phase unavailable'
      );

      // Release 2nd, 3rd, 4th phase
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 3]);
      await meetcapTimeLock.connect(user).release();

      // Should revert if users try to release 5th phase
      await expect(meetcapTimeLock.connect(user).release()).to.be.revertedWith(
        'MeetcapTimeLock: next phase unavailable'
      );
    });

    it('should revert when all lock phases are released', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        10,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );
      await meetcap.transfer(meetcapTimeLock.address, 100);

      // Release all phases
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 5]);
      await meetcapTimeLock.connect(user).release();

      await expect(meetcapTimeLock.connect(user).release()).to.be.revertedWith(
        'MeetcapTimeLock: all phases are released'
      );
    });

    it('should revert when contract has insufficient balance to withdraw', async function () {
      await meetcapTimeLock.initialize(
        factory.address,
        user.address,
        meetcap.address,
        100,
        [
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ],
        [20, 20, 10, 25, 25],
        await EthUtils.latestBlockTimestamp()
      );
      await meetcap.transfer(meetcapTimeLock.address, 50);
      // Release all phases
      ethers.provider.send('evm_increaseTime', [3600 * 24 * 5]);
      await expect(meetcapTimeLock.connect(user).release()).to.be.revertedWith(
        'MeetcapTimeLock: insufficient balance'
      );
    });
  });
});