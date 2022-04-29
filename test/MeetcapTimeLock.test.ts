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


describe.only('MeetcapTimeLock', function () {
  let meetcap: Meetcap;
  let meetcapTimeLock: MeetcapTimeLock;
  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let owner: SignerWithAddress;

  const zeroAddress = ethers.constants.AddressZero;

  beforeEach(async function () {
    [deployer, beneficiary, owner] = await ethers.getSigners();
    meetcap = (await deployContract(deployer, MeetcapArtifact)) as Meetcap
  });


  describe('Register new lock', function () {
    describe('Reverted cases', function () {
      it('Should revert when unlock percent and unlock dates length do not match', async function () {
        const args = [
          beneficiary.address,
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
        ];

        await expect(deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )).revertedWith('Unlock length does not match');
      });

      it('Should revert when total unlock percent is not equal 100', async function () {
        const args = [
          beneficiary.address,
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
        ];

        await expect(deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )).to.revertedWith('Total unlock percent is not equal to 100');
      });

      it('Should revert when the beneficiary address is the zero address', async function () {
        const args = [
          zeroAddress,
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
        ];

        await expect(deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )).to.revertedWith('Beneficiary address cannot be the zero address');

      });

      it('Should revert when the token address is the zero address', async function () {
        const args = [
          beneficiary.address,
          zeroAddress,
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
        ];

        await expect(deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )).to.revertedWith('Token address cannot be the zero address');
      });

      it('Should revert when the total allocation is zero', async function () {
        const args = [
          beneficiary.address,
          meetcap.address,
          0,
          [
            daysToSeconds(1),
            daysToSeconds(2),
            daysToSeconds(3),
            daysToSeconds(4),
            daysToSeconds(5),
          ],
          [20, 20, 20, 20, 20],
          await EthUtils.latestBlockTimestamp()
        ];

        await expect(deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )).to.revertedWith('The total allocation must be greater than zero');
      });
    });


    describe('New lock should be stored correctly', function () {
      beforeEach(async function () {
        const args = [
          beneficiary.address,
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
        ];

        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args)) as MeetcapTimeLock;
      })

      it('Should store the correct owner', async function () {
        expect(await meetcapTimeLock.owner()).to.equal(deployer.address);
      });

      it('Should store the correct beneficiary', async function () {
        expect(await meetcapTimeLock.beneficiary()).to.equal(beneficiary.address);
      });

      it('Should store the correct token', async function () {
        expect(await meetcapTimeLock.token()).to.equal(meetcap.address);
      });

      it('Should store the correct total allocation', async function () {
        expect(await meetcapTimeLock.totalAllocation()).to.equal(10);
      });

      it('Should store the correct released amount', async function () {
        expect(await meetcapTimeLock.releasedAmount()).to.equal(0);
      });

      it('Should store the correct release Id', async function () {
        expect(await meetcapTimeLock.releaseId()).to.equal(0);
      });

      it('Should store the correct lock durations', async function () {
        expect(await meetcapTimeLock.lockDurations()).to.deep.equal([
          daysToSeconds(1),
          daysToSeconds(2),
          daysToSeconds(3),
          daysToSeconds(4),
          daysToSeconds(5),
        ]);
      });

      it('Should store the correct release percents', async function () {
        expect(await meetcapTimeLock.releasePercents()).
          to.deep.equal([20, 20, 20, 20, 20]);
      });

      it('Should store the correct start date', async function () {
        expect(await meetcapTimeLock.startTime()).to.equal(
          await EthUtils.latestBlockTimestamp());
      });
    })
  });


  describe('Release locked tokens', function () {
    describe('Reverted cases', function () {
      it(`Should revert when the current time is before release time`, async function () {
        const args = [
          beneficiary.address,
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
        ];

        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

        await meetcap.transfer(meetcapTimeLock.address, 100);

        await expect(meetcapTimeLock.connect(beneficiary).release()).to.be.revertedWith(
          'Current time is before release time'
        );

        // Release 1st phase
        ethers.provider.send('evm_increaseTime', [3600 * 24]);
        await meetcapTimeLock.connect(beneficiary).release();

        // Should revert if users try to release 2nd phase
        await expect(meetcapTimeLock.connect(beneficiary).release()).to.be.revertedWith(
          'Current time is before release time'
        );

        // Release 2nd, 3rd, 4th phase
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 3]);
        await meetcapTimeLock.connect(beneficiary).release();

        // Should revert if users try to release 5th phase
        await expect(meetcapTimeLock.connect(beneficiary).release()).to.be.revertedWith(
          'Current time is before release time'
        );
      });

      it('Should revert when all phases have already been released', async function () {
        const args = [
          beneficiary.address,
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
        ];
        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;
        await meetcap.transfer(meetcapTimeLock.address, 100);

        // Release all phases
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 5]);
        await meetcapTimeLock.connect(beneficiary).release();

        await expect(meetcapTimeLock.connect(beneficiary).release()).to.be.revertedWith(
          'All phases have already been released'
        );
      });

      it('Should revert when contract has insufficient balance to withdraw', async function () {
        const args = [
          beneficiary.address,
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
        ];

        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

        await meetcap.transfer(meetcapTimeLock.address, 50);
        // Release all phases
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 5]);
        await expect(meetcapTimeLock.connect(beneficiary).release()).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance'
        );
      });
    })


    describe('Should release locked tokens correctly', function () {
      it('Should release locked tokens to correct beneficiary when unlock conditions are met', async function () {
        const args = [
          beneficiary.address,
          meetcap.address,
          BigNumber.from(100_000_000).mul(
            BigNumber.from(10).pow(BigNumber.from(18))
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
        ];
        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

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
        expect(await meetcap.balanceOf(beneficiary.address)).to.equal(
          BigNumber.from(20_000_000).mul(
            BigNumber.from(10).pow(BigNumber.from(decimals))
          )
        );

        // Release 2nd 3rd phase
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 2]);
        await meetcapTimeLock.release();
        expect(await meetcap.balanceOf(beneficiary.address)).to.equal(
          BigNumber.from(50_000_000).mul(
            BigNumber.from(10).pow(BigNumber.from(decimals))
          )
        );

        // Release remaining phase
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 2]);
        await meetcapTimeLock.release();
        expect(await meetcap.balanceOf(beneficiary.address)).to.equal(
          BigNumber.from(100_000_000).mul(
            BigNumber.from(10).pow(BigNumber.from(decimals))
          )
        );
      });

      it('Should emit Release event with correct data', async function () {
        const args = [
          beneficiary.address,
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
        ];

        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

        await meetcap.transfer(meetcapTimeLock.address, 100);

        ethers.provider.send('evm_increaseTime', [3600 * 24]);
        await expect(meetcapTimeLock.connect(beneficiary).release())
          .to.emit(meetcapTimeLock, 'Released')
          .withArgs(20, 1,);

        ethers.provider.send('evm_increaseTime', [3600 * 24 * 4]);
        await expect(meetcapTimeLock.connect(beneficiary).release())
          .to.emit(meetcapTimeLock, 'Released')
          .withArgs(80, 5);
      });

      it('Just to check what maximum gas that release all phases at a time', async function () {
        const args = [
          beneficiary.address,
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
        ];
        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

        await meetcap.transfer(meetcapTimeLock.address, 100);

        ethers.provider.send('evm_increaseTime', [3600 * 24 * 10]);
        await meetcapTimeLock.release();

        expect(await meetcap.balanceOf(beneficiary.address)).to.equal(100);
      });

      it('Should set release dates correct', async function () {
        const originDate = await EthUtils.latestBlockTimestamp();
        const args = [
          beneficiary.address,
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
          originDate
        ];
        meetcapTimeLock = (await deployContract(
          deployer, MeetcapTimeLockArtifact, args
        )) as MeetcapTimeLock;

        await meetcap.transfer(meetcapTimeLock.address, 100);

        const expectedReleaseDates = [
          originDate + daysToSeconds(1),
          originDate + daysToSeconds(5),
          originDate + daysToSeconds(5),
          originDate + daysToSeconds(5),
          originDate + daysToSeconds(5),
        ];

        // Move to 1st phase
        ethers.provider.send('evm_increaseTime', [3600 * 24]);
        await meetcapTimeLock.connect(beneficiary).release();
        const releaseDates = await meetcapTimeLock.releaseDates();

        expect(releaseDates[0]).to.equal(expectedReleaseDates[0]);

        // Move to last phase
        ethers.provider.send('evm_increaseTime', [3600 * 24 * 4]);
        await meetcapTimeLock.connect(beneficiary).release();
        const releaseDates_2 = await meetcapTimeLock.releaseDates();
        expect(releaseDates_2[0]).to.equal(expectedReleaseDates[0]);
        expect(releaseDates_2[1]).to.equal(expectedReleaseDates[1]);
        expect(releaseDates_2[2]).to.equal(expectedReleaseDates[2]);
        expect(releaseDates_2[3]).to.equal(expectedReleaseDates[3]);
        expect(releaseDates_2[4]).to.equal(expectedReleaseDates[4]);
      });
    });
  });
});