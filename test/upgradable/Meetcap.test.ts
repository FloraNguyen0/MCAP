import hre, { ethers, upgrades, waffle } from 'hardhat';
import chai from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Meetcap } from '../../typechain-types/Meetcap';
import { BigNumberish } from '@ethersproject/bignumber';

const { BigNumber } = ethers;
const { expect } = chai;


describe('Meetcap token contract test', () => {
  let meetcap: Meetcap;
  let deployer: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  const zeroAddress = ethers.constants.AddressZero;
  const name = "Meetcap";
  const symbol = 'MCAP';
  const initialSupply = BigNumber.from(10_000_000_000).mul(BigNumber.from(10).pow(18));

  beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners();
    // deploy Meetcap contract
    const Meetcap = await hre.ethers.getContractFactory('Meetcap');
    meetcap = (await upgrades.deployProxy(Meetcap, [], { initializer: "initialize" })) as Meetcap;

    await meetcap.deployed();

  });

  it('Test Meetcap metadata', async function () {
    expect(await meetcap.name()).to.equal(name);
    expect(await meetcap.symbol()).to.equal(symbol);
    expect(await meetcap.decimals()).to.equal(18);
    expect(await meetcap.totalSupply()).to.equal(initialSupply);
    const deployerBalance = await meetcap.balanceOf(deployer.address);
    const totalSupply = await meetcap.totalSupply();

    expect(totalSupply).to.equal(deployerBalance);
  });


  describe('Test _transfer() function', function () {
    it('Should revert when the sender is the zero address', async function () {
      const tx = meetcap.transferFrom(zeroAddress, addr1.address, initialSupply);

      await expect(tx).to.revertedWith('ERC20: insufficient allowance');
    })

    it('Should revert when the receiver is the zero address', async function () {
      const tx = meetcap.transfer(zeroAddress, initialSupply);

      await expect(tx).to.revertedWith('ERC20: transfer to the zero address');
    })

    it('Should revert when the sender doesn’t have enough tokens', async function () {
      const deployerBalance = await meetcap.balanceOf(deployer.address);
      const tx = meetcap.connect(addr1).transfer(deployer.address, 100)

      // Try to send tokens from addr1 (0 tokens) to deployer
      await expect(tx).to.revertedWith('ERC20: transfer amount exceeds balance');
      // Deployer balance shouldn't have changed.
      expect(await meetcap.balanceOf(deployer.address)).to.equal(deployerBalance);
    });

    it('Should transfer tokens between accounts', async function () {
      // Transfer tokens from deployer to addr1
      await meetcap.transfer(addr1.address, 100);
      const addr1Balance = await meetcap.balanceOf(addr1.address);
      const deployerBalance = await meetcap.balanceOf(deployer.address);

      expect(addr1Balance).to.equal(100);
      expect(deployerBalance).to.equal(BigNumber.from(initialSupply).sub(100))

      // Transfer tokens from addr1 to addr2
      await meetcap.connect(addr1).transfer(addr2.address, 100);
      const addr2Balance = await meetcap.balanceOf(addr2.address);
      const updatedAddr1Balance = await meetcap.balanceOf(addr1.address)

      expect(updatedAddr1Balance).to.equal(0);
      expect(addr2Balance).to.equal(100);
    });
  });


  describe('Test approve() function', function () {
    it('Should revert when the owner is the zero address', async function () {
      const tx = meetcap.approve(zeroAddress, initialSupply);

      await expect(tx).to.revertedWith('ERC20: approve to the zero address');
    });

    it('Should approve allowance, emit the Approval event', async function () {
      const tx = await meetcap.approve(addr1.address, 100);
      const allowanceAmount = await meetcap.allowance(deployer.address, addr1.address);

      expect(allowanceAmount).to.equal(100);
      expect(tx).to.emit(meetcap, 'Approval')
        .withArgs(deployer.address, addr1.address, 100);
    })
  });


  describe('Test increaseAllowance() function', function () {
    it('Should revert when the sender is the zero address', async function () {
      const tx = meetcap.increaseAllowance(zeroAddress, 100);

      await expect(tx).revertedWith('ERC20: approve to the zero address');
    });

    it('Should emit the Approval event, increase the spender allowance', async function () {
      await meetcap.approve(addr1.address, 200);
      const tx = await meetcap.increaseAllowance(addr1.address, 100);

      expect(tx).emit(meetcap, 'Approval').
        withArgs(deployer.address, addr1.address, 300);
    })

    it('Increase allowance when there was no approved amount before', async function () {
      const tx = await meetcap.increaseAllowance(addr1.address, 100);

      expect(tx).emit(meetcap, 'Approval').
        withArgs(deployer.address, addr1.address, 100);
    })
  });


  describe('Test decreaseAllowance() function', function () {
    it('Should revert when the spender is the zero address', async function () {
      const tx = meetcap.decreaseAllowance(zeroAddress, 100);

      await expect(tx).revertedWith('ERC20: decreased allowance below zero');
    });

    it('Should revert when there was no approved amount before', async function () {
      const tx = meetcap.decreaseAllowance(addr1.address, 100);

      await expect(tx).revertedWith('ERC20: decreased allowance below zero');
    });

    it('Should revert when more than the full allowance is removed', async function () {
      await meetcap.approve(addr1.address, 100);
      const tx = meetcap.decreaseAllowance(addr1.address, 200);

      await expect(tx).revertedWith('ERC20: decreased allowance below zero');
    });

    it('Should emit the Approval event, decrease the spender allowance', async function () {
      await meetcap.approve(addr1.address, 100);
      const tx = await meetcap.decreaseAllowance(addr1.address, 40);

      expect(tx).emit(meetcap, 'Approval').withArgs(deployer.address, addr1.address, 60);
    });

    it('Should set the allowance to zero when all allowance is removed', async function () {
      await meetcap.approve(addr1.address, 100);
      const tx = await meetcap.decreaseAllowance(addr1.address, 100);
      const allowanceAmount = await meetcap.allowance(deployer.address, addr1.address);

      expect(allowanceAmount).equal(0);
    });
  });


  describe('Test _burn() function', function () {
    it('Should revert when burn amount exceeds balance', async function () {
      const deployerBalance = await meetcap.balanceOf(deployer.address);
      const burnAmount = BigNumber.from(deployerBalance).add(100);
      const tx = meetcap.burn(burnAmount);

      await expect(tx).to.revertedWith('ERC20: burn amount exceeds balance');
    });

    it('Should revert when burnFrom amount exceeds allowance', async function () {
      await meetcap.approve(addr1.address, 100);
      const tx = meetcap.connect(addr1).burnFrom(deployer.address, 200);

      await expect(tx).to.revertedWith('ERC20: insufficient allowance');
    });

    const describeBurn = function (description: string, burnAmount: BigNumberish) {
      it('Should decrease allowance, totalSupply, balance and emit events', async function () {
        await meetcap.approve(addr1.address, burnAmount);
        const tx = await meetcap.connect(addr1).burnFrom(deployer.address, burnAmount);
        const expectedSupply = initialSupply.sub(burnAmount);

        expect(tx).to.emit(meetcap, 'Approval').withArgs(
          deployer.address, addr1.address, 0
        );
        expect(tx).to.emit(meetcap, 'Transfer').withArgs(
          deployer.address, zeroAddress, burnAmount
        );
        expect(
          await meetcap.allowance(deployer.address, addr1.address)
        ).to.equal(0);
        expect(await meetcap.totalSupply()).to.equal(expectedSupply);
        expect(await meetcap.balanceOf(deployer.address)).to.equal(expectedSupply);
      });
    };

    describeBurn('For entire balance', initialSupply);
    describeBurn('For less amount than balance', initialSupply.sub(1));
    describeBurn('For 0 amount', 0);
  })
});