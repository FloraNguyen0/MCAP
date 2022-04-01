// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./BEP20.sol";
import "../libraries, interfaces, abstracts/Context.sol";


abstract contract BEP20Burnable is Context, BEP20 {
    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public virtual {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }
}