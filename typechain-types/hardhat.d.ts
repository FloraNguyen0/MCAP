/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "IBEP20",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.IBEP20__factory>;
    getContractFactory(
      name: "BEP20Burnable",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BEP20Burnable__factory>;
    getContractFactory(
      name: "BEP20Token",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BEP20Token__factory>;
    getContractFactory(
      name: "Meetcap",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.Meetcap__factory>;
    getContractFactory(
      name: "MeetcapPresale",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MeetcapPresale__factory>;
    getContractFactory(
      name: "MeetcapTimeLock",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.MeetcapTimeLock__factory>;
    getContractFactory(
      name: "TokenTimeLock",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TokenTimeLock__factory>;

    getContractAt(
      name: "IBEP20",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.IBEP20>;
    getContractAt(
      name: "BEP20Burnable",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BEP20Burnable>;
    getContractAt(
      name: "BEP20Token",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BEP20Token>;
    getContractAt(
      name: "Meetcap",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.Meetcap>;
    getContractAt(
      name: "MeetcapPresale",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MeetcapPresale>;
    getContractAt(
      name: "MeetcapTimeLock",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.MeetcapTimeLock>;
    getContractAt(
      name: "TokenTimeLock",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TokenTimeLock>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}
