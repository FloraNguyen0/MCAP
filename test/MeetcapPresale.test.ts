import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import MeetcapArtifact from '../artifacts/contracts/token/Meetcap.sol/Meetcap.json';
import MeetcapPresaleArtifact from '../artifacts/contracts/token/MeetcapPresale.sol/MeetcapPresale.json';
import { Meetcap } from '../typechain-types/Meetcap';
import { MeetcapPresale } from '../typechain-types/MeetcapPresale';
import { parseEther } from '@ethersproject/units';
import { ContractTransaction } from '@ethersproject/contracts';

const { deployContract } = waffle;
const { BigNumber } = ethers;
const { expect } = chai;


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
        meetcap = (await deployContract(deployer, MeetcapArtifact)) as Meetcap
        meetcapPresale = (await deployContract(
            deployer, MeetcapPresaleArtifact,
            [rate, meetcap.address])) as MeetcapPresale;

        await meetcap.connect(deployer).transfer(meetcapPresale.address, presaleAmount);
    })

    it('Test meetcapPresale metadata', async function () {
        expect(await meetcapPresale.rate()).equal(rate);
        expect(await meetcapPresale.token()).equal(meetcap.address);
        expect(await meetcapPresale.owner()).equal(deployer.address);
        expect(await meetcap.balanceOf(meetcapPresale.address)).equal(presaleAmount);
    })


    describe('Test buyTokens() function', function () {
        describe('Test _validatePurchase() function', function () {
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
            })

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
                )
            });
        });
    });


    describe('Test forwardFunds() function', function () {
        it('Should revert when the presale contract has insufficient balance to forward funds', async function () {
            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: parseEther('10') });

            const tx = meetcapPresale.forwardFunds(parseEther('20'));
            await expect(tx).revertedWith('Insufficient balance');
        })

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
    });


    describe('Test endPresale() function', function () {
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

        it('End presale when there is no users buying yet', async function () {
            const ownerBalance = await deployer.getBalance();

            const tx = await meetcapPresale.endPresale();
            const receipt = await tx.wait();
            const gasFee = BigNumber.from(receipt.gasUsed).mul(receipt.effectiveGasPrice);

            expect((await deployer.getBalance())).equal(ownerBalance.sub(gasFee));
            expect(await meetcap.balanceOf(deployer.address)).equal(presaleAmount);
        })

        it('Should end the presale correctly', async function () {
            const ownerBalance = await deployer.getBalance();
            const investmentAmount = parseEther('10');

            await meetcapPresale.connect(addr1).buyTokens(
                addr1.address, { value: investmentAmount });

            const tx = await meetcapPresale.endPresale();
            const receipt = await tx.wait();
            const gasFee = BigNumber.from(receipt.gasUsed).mul(receipt.effectiveGasPrice);

            expect((await deployer.getBalance()))
                .equal(ownerBalance.add(investmentAmount).sub(gasFee));
            expect(await meetcap.balanceOf(deployer.address))
                .equal(presaleAmount.sub(investmentAmount.mul(rate)));
        });
    });
})
