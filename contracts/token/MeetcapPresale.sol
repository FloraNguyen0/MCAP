// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Meetcap.sol";
import "../BEP20/IBEP20.sol";
import "../Utilities/Context.sol";
import "../Utilities/ReentrancyCheck.sol";
import "../Utilities/Ownable.sol";


contract MeetcapPresale is Context, ReentrancyCheck, Ownable {
    /// The token being sold
    IBEP20 private _token;

    // How many token units a buyer gets per wei.
    // The rate is the conversion between wei and the smallest and indivisible token unit.
    uint256 private _rate;

    /// The amount of wei raised
    uint256 private _weiRaised;

    /// The address where funds are collected
    address payable private _adminAddress;

    event TokensPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 weiSent,
        uint256 tokensBought
    );

    constructor(uint256 rate_, address payable adminAddress_, IBEP20 token_) {
        require(rate_ > 0, "The token rate cannot be 0");
        require(
            adminAddress_ != address(0), 
            "Wallet address cannot be the zero address"
        );
        require(
            address(token_) != address(0), 
            "Token address cannot be the zero address"
        );

        _rate = rate_;
        _adminAddress = adminAddress_;
        _token = token_;

        transferOwnership(adminAddress_);
    }

    receive() external payable {
        buyTokens(_msgSender());
    }

    function token() public view virtual returns (IBEP20) {
        return _token;
    } 

    function rate() public view virtual returns (uint256) {
        return _rate;
    }

    function weiRaised() public view virtual returns (uint256) {
        return _weiRaised;
    }

    function adminAddress() public view virtual returns (address payable) {
        return _adminAddress;
    }

    
    function buyTokens(address beneficiary) 
        public 
        virtual 
        payable 
        nonReentrant 
        returns (bool)
    {
        uint256 weiSent = msg.value;
        uint256 tokensBought = weiSent * _rate;

        _validatePurchase(beneficiary, weiSent, tokensBought);

        _weiRaised = _weiRaised + weiSent;

        _token.transfer(beneficiary, tokensBought);

        emit TokensPurchased(_msgSender(), beneficiary, weiSent, tokensBought);

        return true;
    }

    function forwardFunds(uint256 weiAmount) 
        public 
        virtual 
        onlyOwner 
        returns (bool)
    {
        require(address(this).balance >= weiAmount, "Insufficient balance");

        _transferEth(_adminAddress, weiAmount);

        return true;
    }

    function endPresale() 
        public 
        virtual 
        onlyOwner
        returns (bool) {
        uint256 tokenBalance = _token.balanceOf(address(this));
        uint256 weiBalance = address(this).balance;

        _token.transfer(_adminAddress, tokenBalance);
        _transferEth(_adminAddress, weiBalance);

        return true;
    }

    function _validatePurchase(
        address beneficiary, 
        uint256 weiSent, 
        uint256 tokensBought
    ) private view {
        require(
            beneficiary != address(0), 
            "Beneficiary address cannot be the zero address."
        );
        require(weiSent != 0, "You cannot buy with 0 BNB.");
        require(
            _token.balanceOf(address(this)) >= tokensBought,
            "Token amount exceeds the presale balance."
        );
    }

    function _transferEth(
        address payable beneficiary,
        uint256 weiAmount
        ) private nonReentrant {
        (bool success, bytes memory data) = beneficiary.call{value: weiAmount}("");

        require(success, "Failed to send Ether");
    }
}
