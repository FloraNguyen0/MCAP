// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;


library SafeMathX {
    // Calculate x * y / 100 rounding down.
    function mulScale(
        uint256 x,
        uint256 y
    ) internal pure returns (uint256) {
        uint256 a = x / 100;
        uint256 b = x % 100;
        uint256 c = y / 100;
        uint256 d = y % 100;

        return a * c * 100 + a * d + b * c + (b * d) / 100;
    }
}
