// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../ERC20/ERC20Burnable.sol";


contract Meetcap is ERC20Burnable {
    constructor() ERC20("Meetcap", "MCAP") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}

