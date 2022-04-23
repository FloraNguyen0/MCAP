// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../BEP20/BEP20Burnable.sol";


contract Meetcap is BEP20Burnable {
    constructor() BEP20("Meetcap", "MCAP") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}

//  struct lock_box{

//     uint256 value_;
//     uint256 releaseTime;
// }
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/token/ERC20/IERC20.sol
// lock_box[] public lockbox_arr;

// modifier onlyOwner {
//   require(msg.sender == owner) ;
//   _;
// }

// function lock_erc(uint256 value_, uint256 releaseTime) onlyOwner external returns (uint256) {

//     if(lockbox_arr.length == 0){
//         lockbox_arr.length++;
//     }

//     balanceof_[msg.sender] = balanceof_[msg.sender].sub(value_);

//     lockbox_arr.length++;

//     lockbox_arr[lockbox_arr.length-1].value_ = value_;
//     lockbox_arr[lockbox_arr.length-1].releaseTime = releaseTime;

//     return lockbox_arr.length-1;

// }

// function release_erc(uint256 lockbox_no) onlyOwner public returns(bool){

//     bool status = false;

//     lock_box storage lb = lockbox_arr[lockbox_no];

//     uint256 value_ = lb.value_;
//     uint256 releaseTime = lb.releaseTime;

//     if(releaseTime < now){
//         balanceof_[owner] = balanceof_[owner].add(value_);
//         status = true;
//         lb.value_ = 0;
//     }

//     return status;
// }
