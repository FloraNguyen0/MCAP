// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./Meetcap.sol";
import "../BEP20/IBEP20.sol";
import "../BEP20/SafeBEP20.sol";
import "../libraries, interfaces, abstracts/Context.sol";
import "../libraries, interfaces, abstracts/ReentrancyCheck.sol";


// consider to change internal fuctions to private

contract MeetcapPresale is Context, ReentrancyCheck {
    using SafeBEP20 for IBEP20;

    // The token being sold
    IBEP20 private _token;

    // The number of token units a buyer gets per wei.
    // The rate is the conversion between wei and the smallest and indivisible token unit.
    // So, if you are using a rate of 1 with a ERC20Detailed token with 3 decimals called TOK
    // 1 wei will give you 1 unit, or 0.001 TOK.
    uint256 private _rate;

    // The address where funds are collected
    address payable private _presaleWallet;

    // The amount of wei raised
    uint256 private _weiRaised;

    event TokensPurchased(
        address indexed purchaser,
        uint256 weiValue,
        uint256 amount
    );

    constructor(uint256 rate_, address payable presaleWallet_, IBEP20 token_) {
        require(rate_ > 0, "Crowdsale: rate is 0");
        require(presaleWallet_ != address(0), "Crowdsale: wallet is the zero address");
        require(address(token_) != address(0), "Crowdsale: token is the zero address");

        _rate = rate_;
        _presaleWallet = presaleWallet_;
        _token = token_;

        // Token price is 0.001 Bnb
        // _rate = 1000000000000000;
        // _presaleWallet = payable(address(this));
        // _token = token_;
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

    function presaleWallet() public view virtual returns (address payable) {
        return _presaleWallet;
    }

    function weiRaised() public view virtual returns (uint256) {
        return _weiRaised;
    }

    function buyTokens(address beneficiary) public virtual payable nonReentrant {
        uint256 weiAmount = msg.value;
        uint256 tokenAmount = weiAmount * _rate;

        _preValidatePurchase(beneficiary, weiAmount, tokenAmount);

        _weiRaised = _weiRaised + weiAmount;

        _deliverTokens(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, weiAmount, tokenAmount);

        _forwardFunds();
    }

    function _preValidatePurchase(address beneficiary, uint256 weiAmount, uint256 tokenAmount)
        internal
        view
    {
        require(beneficiary != address(0), "Crowdsale: beneficiary is the zero address");
        require(weiAmount != 0, "Sorry, you canot buy with 0 BNB");
        require(_presaleWallet.balance >= tokenAmount);
        this;
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        _token.safeTransfer(beneficiary, tokenAmount);

    }

    function _forwardFunds() internal {
        _presaleWallet.transfer(msg.value);
    }

    // function endPresale() public {
    //     require(msg.sender == _presaleWallet);
    //     require(_token.transfer(_presaleWallet, _token.balanceOf(this)));

    //     _presaleWallet.transfer(address(this).balance);
    // }
}
