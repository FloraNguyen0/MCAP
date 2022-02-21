// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./MeetcapToken.sol";


abstract contract ReentrancyCheck {
    bool private _notEntered;

    constructor ()  {
        _notEntered = true;
    }
  
    modifier nonReentrant {
        require(_notEntered, "Sorry, you cannot make a reentrant call");

        _notEntered = false;

        _;

        _notEntered = true;
    }
}


contract MeetcapPresale is ReentrancyCheck {

    uint256 private _rate;
    address payable private _presaleWallet;
    Meetcap private _token;
    uint256 private _weiRaised;
  
    event TokensPurchased(address indexed purchaser, uint256 weiValue, uint256 amount);

    constructor (Meetcap token_)  {
         // Token price is 0.001 Bnb
        _rate = 1000000000000000;
        _presaleWallet = payable(msg.sender);
        _token = token_;
    }

   receive () external payable {
        buyTokens();
    }

    
    function token() public view returns (Meetcap) {
        return _token;
    }

     function rate() public view returns (uint256) {
        return _rate;
    }

   
    function presaleWallet() public view returns (address payable) {
        return _presaleWallet;
    }

    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    function buyTokens() public nonReentrant payable {
        uint256 weiAmount = msg.value;

        uint256 tokens = weiAmount * _rate;

        _preValidatePurchase(weiAmount, tokens);

        _weiRaised = _weiRaised + weiAmount;

        _deliverTokens(msg.sender, tokens);

        emit TokensPurchased(msg.sender, weiAmount, tokens);

        _forwardFunds();
    }


    // function endPresale() public {
    //     require(msg.sender == _presaleWallet);
    //     require(_token.transfer(_presaleWallet, _token.balanceOf(this)));

    //     _presaleWallet.transfer(address(this).balance);
    // }

   
    function _preValidatePurchase(uint256 weiAmount, uint256 tokens) internal view {
        require(weiAmount != 0, "Sorry, you canot buy with 0 BNB");
        require(_presaleWallet.balanceOf(this) >= tokens);
        this; 
    }
   
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        safeTransfer(_token, beneficiary, tokenAmount);
    }
  
   
    function _forwardFunds() internal {
        _presaleWallet.transfer(msg.value);
    }

   

    function safeTransfer(Meetcap token_, address to, uint256 value) internal {
        callOptionalReturn(token_, abi.encodeWithSelector(token_.transfer.selector, to, value));
    }

    function callOptionalReturn(Meetcap token_, bytes memory data) private {

        (bool success, bytes memory returndata) = address(token_).call(data);
        require(success, "Sorry, Low-level call failed");

        if (returndata.length > 0) { 
            require(abi.decode(returndata, (bool)), "Sorry, ERC20 operation did not succeed");
        }
    }

}
