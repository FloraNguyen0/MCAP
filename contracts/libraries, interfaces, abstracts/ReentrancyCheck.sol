// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract ReentrancyCheck {
    bool private _notEntered;

    constructor() {
        _notEntered = true;
    }

    modifier nonReentrant() {
        require(_notEntered, "Sorry, you cannot make a reentrant call");

        _notEntered = false;

        _;

        _notEntered = true;
    }
}