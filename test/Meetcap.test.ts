import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
const { ethers } = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = ethers;


describe('Meetcap', () => {
  let meetcap: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    [owner, addr1] = await ethers.getSigners();
    // deploy the contract
    const Meetcap = await ethers.getContractFactory("Meetcap");
    const meetcap = await Meetcap.deploy();
    await meetcap.deployed();
    // meetcap = await ethers.getContract('Meetcap');
    // await meetcap.deployed();
  });

  describe('Deployment', function () {
    it('Should have 18 decimals', async () => {
      expect(await meetcap.decimals()).to.equal(18);
    });

    it('Should have 10B total supply', async () => {
      expect(await meetcap.totalSupply()).to.equal(
        BigNumber.from(10_000_000_000).mul(BigNumber.from(10).pow(18))
      );
    });

    it('Should set the right owner', async function () {
      expect(await meetcap.owner()).to.equal(owner.address);
    });

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await meetcap.balanceOf(owner.address);
      expect(await meetcap.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      // Transfer 50 tokens from owner to addr1
      const decimals = await meetcap.decimals();
      const transferAmount = BigNumber.from(10_000_000).mul(
        BigNumber.from(10).pow(decimals)
      );
      await meetcap.transfer(addr1.address, transferAmount);
      const addr1Balance = await meetcap.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await meetcap.connect(addr1).transfer(addr2.address, transferAmount);
      const addr2Balance = await meetcap.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it('Should fail if sender doesn’t have enough tokens', async function () {
      const initialOwnerBalance = await meetcap.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(meetcap.connect(addr1).transfer(owner.address, 1)).to.be
        .reverted;

      // Owner balance shouldn't have changed.
      expect(await meetcap.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it('Should update balances after transfers', async function () {
      const initialOwnerBalance = await meetcap.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await meetcap.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await meetcap.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await meetcap.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(
        BigNumber.from(initialOwnerBalance).sub(150)
      );

      const addr1Balance = await meetcap.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await meetcap.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it('should reduce total supply when burn', async function () {
      const initialOwnerBalance = await meetcap.balanceOf(owner.address);
      const burnAmount = 1_000_000_000;
      await meetcap.burn(burnAmount);
      const totalSupply = await meetcap.totalSupply();
      expect(totalSupply).to.equal(
        BigNumber.from(initialOwnerBalance).sub(burnAmount)
      );
    });

    it('should revert when burn amount exceeds balance', async function () {
      const initialOwnerBalance = await meetcap.balanceOf(owner.address);
      const burnAmount = BigNumber.from(initialOwnerBalance).add(1_000_000);
      await expect(meetcap.burn(burnAmount)).to.revertedWith(
        'BEP20: burn amount exceeds balance'
      );
    });

    it('should revert when burnFrom amount exceeds allowance', async function () {
      await meetcap.approve(addr1.address, 100);
      await expect(meetcap.connect(addr1).burnFrom(owner.address, 200)).to
        .reverted;
    });

    it('should burnFrom really burn tokens, reduce allowance, reduce total supply', async function () {
      const burnAmount = 100;
      await meetcap.approve(addr1.address, burnAmount);
      const ownerBalance = await meetcap.balanceOf(owner.address);

      await meetcap.connect(addr1).burnFrom(owner.address, burnAmount);
      expect(
        await meetcap.allowance(owner.address, addr1.address)
      ).to.equal(0);
      expect(await meetcap.balanceOf(owner.address)).to.equal(
        BigNumber.from(ownerBalance).sub(burnAmount)
      );
      expect(await meetcap.totalSupply()).to.equal(
        BigNumber.from(ownerBalance).sub(burnAmount)
      );
    });
  });
});