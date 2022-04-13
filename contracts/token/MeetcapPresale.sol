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

    uint256 private _tokenPrice;

    /// The amount of wei raised
    uint256 private _weiRaised;

    /// The address where funds are collected
    address payable private _presaleWallet;

    event TokensPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 weiValue,
        uint256 amount
    );

    constructor(uint256 tokenPrice_, address payable presaleWallet_, IBEP20 token_) {
        require(tokenPrice_ > 0, "Crowdsale: tokenPrice is 0");
        require(
            presaleWallet_ != address(0), 
            "Crowdsale: wallet is the zero address"
        );
        require(
            address(token_) != address(0), 
            "Crowdsale: token is the zero address"
        );

        _tokenPrice = tokenPrice_;
        _presaleWallet = presaleWallet_;
        _token = token_;
        transferOwnership(presaleWallet_);


        // Token price is 0.001 Bnb
        // _tokenPrice = 1000000000000000;
        // _presaleWallet = payable(address(this));
    }

    receive() external payable {
        buyTokens(_msgSender());
    }

    function token() public view virtual returns (IBEP20) {
        return _token;
    } 

    function tokenPrice() public view virtual returns (uint256) {
        return _tokenPrice;
    }

    function weiRaised() public view virtual returns (uint256) {
        return _weiRaised;
    }

    function presaleWallet() public view virtual returns (address payable) {
        return _presaleWallet;
    }

    
    function buyTokens(address beneficiary) 
        public 
        virtual 
        payable 
        nonReentrant 
        returns (bool)
    {
        uint256 weiSent = msg.value;
        uint256 tokensBought = weiSent / _tokenPrice;

        _verifyPurchase(beneficiary, weiSent, tokensBought);

        _weiRaised = _weiRaised + weiSent;

        _transferTokens(beneficiary, tokensBought);

        emit TokensPurchased(_msgSender(), beneficiary, weiSent, tokensBought);

        return true;
    }

    function forwardFunds(uint256 ethAmount) 
        public 
        virtual 
        onlyOwner 
        returns (bool)
    {
        _transferEth(_presaleWallet, ethAmount);

        return true;
    }

    function endPresale() public virtual onlyOwner returns (bool) {
        uint256 tokenBalance = _token.balanceOf(address(this));
        uint256 ethBalance = address(this).balance;

        _transferTokens(_presaleWallet, tokenBalance);
        _transferEth(_presaleWallet, ethBalance);

        return true;
    }

    function _verifyPurchase(
        address beneficiary, 
        uint256 weiSent, 
        uint256 tokensBought
    ) private view {
        require(
            beneficiary != address(0), 
            "Beneficiary cannot be the zero address."
        );
        require(weiSent != 0, "You canot buy with 0 BNB.");
        require(
            _token.balanceOf(address(this)) >= tokensBought,
            "Our presale has ended."
        );
        // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        this;
    }

    function _transferTokens(address beneficiary, uint256 tokensAmount) private {
        _token.transfer(beneficiary, tokensAmount);
    }

    function _transferEth(address payable beneficiary, uint256 ethAmount) private {
        beneficiary.transfer(ethAmount);
    }
}
