import hre, { ethers, upgrades } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Meetcap } from '../../typechain-types/Meetcap';
import { MeetcapPresale } from '../../typechain-types/MeetcapPresale';
import { parseEther } from '@ethersproject/units';
import { ContractTransaction } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';

describe('MeetcapPresale', () => {
    let meetcap: Meetcap;
    let meetcapPresale: MeetcapPresale;
    let deployer: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    const zeroAddress = ethers.constants.AddressZero;

    // 1500 token units a buyer gets per wei.
    // Token price is 1/1500 Matic per token
    const rate = 1500;

    // Presale Amount is 300m tokens
    const presaleAmount = parseEther('300000000');

    beforeEach(async () => {
        [deployer, addr1, addr2] = await ethers.getSigners();

        // Deploy Meetcap
        const Meetcap = await hre.ethers.getContractFactory('Meetcap');
        meetcap = (await upgrades.deployProxy(Meetcap, [], { initializer: "initialize" })) as Meetcap;
        await meetcap.deployed();

        // Deploy MeetcapPresale
        const MeetcapPresale = await hre.ethers.getContractFactory('MeetcapPresale');
        meetcapPresale = await MeetcapPresale.deploy(rate, meetcap.address);
        await meetcapPresale.deployed();

        await meetcap.transfer(meetcapPresale.address, presaleAmount);
    });

    describe('Test meetcapPresale metadata', () => {
        it('Meetcap rate', async () => {
            expect(await meetcapPresale.rate()).equal(rate);
        });
        it('Meetcap token address', async () => {
            expect(await meetcapPresale.token()).equal(meetcap.address);
        });
        it('Meetcap presale deployer', async () => {
            expect(await meetcapPresale.owner()).equal(deployer.address);
        });
        it('Meetcap presale amount', async () => {
            expect(await meetcap.balanceOf(meetcapPresale.address)).equal(presaleAmount);
        });
    });

    describe('Test buyTokens() function', function () {
        describe('Test _preValidatePurchase() function', function () {
            it('Should revert when the beneficiary address is the zero address',
                async function () {
                    const tx = meetcapPresale.connect(addr1).buyTokens(
                        zeroAddress, { value: parseEther('10') });

                    await expect(tx).revertedWith(
                        'Beneficiary address cannot be the zero address.'
                    );
                });

            it('Should revert when buy with 0 value', async function () {
                const tx = meetcapPresale.connect(addr1).buyTokens(
                    addr1.address, { value: 0 });

                await expect(tx).revertedWith(
                    'You cannot buy with 0 BNB.'
                );
            });

            it('Should revert when the token amount exceeds the presale balance',
                async function () {
                    const tx = meetcapPresale.connect(addr1).buyTokens(
                        addr1.address, { value: presaleAmount.div(rate).mul(2) });

                    await expect(tx).revertedWith(
                        'Token amount exceeds the presale balance.'
                    );
                });

            it('Should revert if a user buy tokens when all tokens have sold out',
                async function () {
                    // Set the balance of addr1 to 500000000115863701807178 Wei
                    await ethers.provider.send("hardhat_setBalance", [
                        addr1.address,
                        "0x69E10DE7CFD76F49E04A",
                    ]);
                    await meetcapPresale.connect(addr1).buyTokens(
                        addr1.address, { value: presaleAmount.div(rate) });

                    expect(await meetcap.balanceOf(meetcapPresale.address)).equal(0);

                    const tx = meetcapPresale.connect(addr1).buyTokens(
                        addr1.address, { value: 1 });

                    await expect(tx).revertedWith('Token amount exceeds the presale balance.');
                });
        });

        describe('Should execute buyTokens() correctly', function () {
            const investmentAmount = parseEther('10');
            const tokensBought = investmentAmount.mul(rate);
            let tx: ContractTransaction;

            beforeEach(async function () {
                tx = await meetcapPresale.connect(addr1).buyTokens(
                    addr1.address, { value: investmentAmount });
            });

            it('Should transfer corresponding ethers to the presale contract', async function () {
                expect(await ethers.provider.getBalance(meetcapPresale.address)).equal(investmentAmount);
            });

            it('Should update the _weiRaise', async function () {
                expect(await meetcapPresale.weiRaised()).equal(investmentAmount);
            });

            it('Should decrease token amount of the presale contract', async function () {
                expect(await meetcap.balanceOf(meetcapPresale.address))
                    .equal(presaleAmount.sub(tokensBought));
            });

            it('Should transfer tokens to the beneficiary', async function () {
                expect(await meetcap.balanceOf(addr1.address)).equal(tokensBought);
            });

            it('Should emit TokensPurchased event', async function () {
                expect(tx).emit(meetcapPresale, 'TokensPurchased').withArgs(
                    addr1.address, addr1.address, investmentAmount, tokensBought
                );
            });
        });
    });

    describe('Test forwardFunds() function', function () {
        it('Should forward funds correctly', async function () {
            const ownerBalance = await deployer.getBalance();
            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: parseEther('10') });

            const tx = await meetcapPresale.forwardFunds(parseEther('5'));
            const receipt = await tx.wait();
            const gasFee = BigNumber.from(receipt.gasUsed).mul(receipt.effectiveGasPrice);

            expect(await ethers.provider.getBalance(meetcapPresale.address)).equal(parseEther('5'));
            expect(await deployer.getBalance()).equal(ownerBalance.add(parseEther('5')).sub(gasFee));
        });

        it('Should revert when the presale contract has insufficient balance to forward funds', async function () {
            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: parseEther('10') });

            const tx = meetcapPresale.forwardFunds(parseEther('20'));
            await expect(tx).revertedWith('Insufficient balance');
        });

        it('Should revert when the presale contract has 0 balance', async function () {
            const tx = meetcapPresale.forwardFunds(parseEther('10'));
            await expect(tx).revertedWith('Insufficient balance');
        });

        it('Should revert when not called by the owner', async function () {
            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: parseEther('10') });

            const tx = meetcapPresale.connect(addr2).forwardFunds(parseEther('5'));
            await expect(tx).revertedWith('Ownable: caller is not the owner');
        });
    });

    describe('Test endPresale() function', function () {
        it('Should end the presale correctly', async function () {
            const ownerBalance = await deployer.getBalance();
            const ownerTokens = await meetcap.balanceOf(deployer.address);
            const investmentAmount = parseEther('10');

            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: investmentAmount });

            const tx = await meetcapPresale.endPresale();
            const receipt = await tx.wait();
            const gasFee = BigNumber.from(receipt.gasUsed).mul(receipt.effectiveGasPrice);

            expect((await deployer.getBalance()))
                .equal(ownerBalance.add(investmentAmount).sub(gasFee));
            expect(await meetcap.balanceOf(deployer.address))
                .equal(ownerTokens.add(presaleAmount.sub(investmentAmount.mul(rate))));
        });

        it('End presale before there is any users buying', async function () {
            const ownerBalance = await deployer.getBalance();
            const ownerTokens = await meetcap.balanceOf(deployer.address);

            const tx = await meetcapPresale.endPresale();
            const receipt = await tx.wait();
            const gasFee = BigNumber.from(receipt.gasUsed).mul(receipt.effectiveGasPrice);

            expect((await deployer.getBalance())).equal(ownerBalance.sub(gasFee));
            expect(await meetcap.balanceOf(deployer.address)).equal(ownerTokens.add(presaleAmount));
        });

        it('Should revert if a user buy tokens when the presale has ended',
            async function () {
                await meetcapPresale.endPresale();
                const tx = meetcapPresale.connect(addr1).buyTokens(
                    addr1.address, { value: 100 });

                await expect(tx).revertedWith('Token amount exceeds the presale balance.');
            });

        it('Should revert when not called by the owner', async function () {
            const tx = meetcapPresale.connect(addr1).endPresale();

            await expect(tx).revertedWith('Ownable: caller is not the owner');
        });
    });
})
