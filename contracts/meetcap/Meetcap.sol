// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../token/ERC20/ERC20Upgradeable.sol";
import "../token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";
import " ../access/OwnableUpgradeable.sol";
import "../proxy/utils/UUPSUpgradeable.sol";

contract Meetcap is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize() initializer public {
        __ERC20_init("Meetcap", "MCAP");
        __ERC20Burnable_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}