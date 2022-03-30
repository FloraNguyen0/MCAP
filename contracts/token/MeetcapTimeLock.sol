// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../library & interface/IBEP20.sol";
import "../library & interface/SafeBEP20.sol";
import "../library & interface/SafeMathX.sol";

// change public functions to external, memory to calldata if necessary
// fix availableReleaseAmount, stepReleaseAmount if necessary


contract MeetcapTimeLock is Ownable {
    using SafeBEP20 for IBEP20;
    using SafeMathX for uint256;

    // Total amount of tokens had been locked initially
    uint256 private _amount;

    // Total amount of tokens have been released
    uint256 private _releasedAmount;

    // Beneficiary
    address private _beneficiary;

    // Token address
    address private _token;

    // Start date of the lockup period
    uint64 private _startDate;

    // Dates the beneficiary could start execute a release for each phase
    uint64[] private _releaseDates;

    // Lock duration (in seconds) of each phase
    uint32[] private _lockDurations;

    // Release percent of each phase
    uint32[] private _releasePercents;

    // Next release phase
    uint32 private _nextReleaseIdx;
    
    // initialized status
    bool private _isInitialized = false;

    event Released(
        uint256 phaseReleasedAmount,
        uint256 totalReleasedAmount,
        uint32 fromIdx,
        uint32 toIdx,
        uint64 date
    );

    event SafeSetupActivated(uint256 amount, address to, uint64 date);

    function token() public view returns (IBEP20) {
        return IBEP20(_token);
    }

    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    function amount() public view returns (uint256) {
        return _amount;
    }

    function releasedAmount() public view returns (uint256) {
        return _releasedAmount;
    }

    function startDate() public view returns (uint64) {
        return _startDate;
    }

    function lockDurations() public view returns (uint32[] memory) {
        return _lockDurations;
    }

    function releasePercents() public view returns (uint32[] memory) {
        return _releasePercents;
    }

    function releaseDates() public view returns (uint64[] memory) {
        return _releaseDates;
    }

    function nextReleaseIdx() public view returns (uint32) {
        return _nextReleaseIdx;
    }

    function isInitialized() public view returns (bool){
        return _isInitialized;
    }

    // This function is created for the purpose of testing 
    function lockData()
        public
        view
        returns (
            address token_,
            address beneficiary_,
            uint256 amount_,
            uint256 releasedAmount_,
            uint64 startDate_,
            uint32[] memory lockDurations_,
            uint32[] memory releasePercents_,
            uint64[] memory releaseDates_,
            uint32 nextReleaseIdx_,
            address owner_,
            bool isInitialized_
        )
    {
        return (
            address(token()),
            beneficiary(),
            amount(),
            releasedAmount(),
            startDate(),
            lockDurations(),
            releasePercents(),
            releaseDates(),
            nextReleaseIdx(),
            owner(),    
            isInitialized()
        );
    }

    /// Owner is the owner of all lockup contracts who could call safeSetup, not the deployer (see transferOwnership),
    /// The ownership is renounced after the setup is done safely
    function initialize(
        address owner_,
        address beneficiary_,
        address token_,
        uint256 amount_,
        uint32[] calldata lockDurations_,
        uint32[] calldata releasePercents_,
        uint64 startDate_
    ) public returns (bool) {
        require(!_isInitialized, "Contract is already initialized!");
        _isInitialized = true;
        
        require(
            lockDurations_.length == releasePercents_.length,
            "TokenTimeLock: unlock length does not match"
        );

        uint256 _sum;
        for (uint256 i = 0; i < releasePercents_.length; ++i) {
            _sum += releasePercents_[i];
        }

        require(_sum == 100, "TokenTimeLock: unlock percent sum is not equal to 100");

        require(beneficiary_ != address(0), "TokenTimeLock: user address is zero");

        require(token_ != address(0), "TokenTimeLock: token address is zero");

        require(
            owner_ != address(0),
            "TokenTimeLock: owner address is zero"
        );

        require(amount_ > 0, "TokenTimeLock: The amount must be greater than zero");

        _beneficiary = beneficiary_;
        _token = token_;
        _startDate = startDate_;
        _lockDurations = lockDurations_;
        _releasePercents = releasePercents_;
        _amount = amount_;
        _releasedAmount = 0;
        _nextReleaseIdx = 0;
        _releaseDates = new uint64[](_lockDurations.length);

        transferOwnership(owner_);

        return true;
    }

    /// @notice Release unlocked tokens to user.
    /// @dev User (sender) can release unlocked tokens by calling this function.
    /// This function will release locked tokens from multiple lock phases that meets unlock requirements
   
    function release() public returns (bool) {
        uint256 numOfPhases = _lockDurations.length;

        require(
            _nextReleaseIdx < numOfPhases,
            "MeetcapTimeLock: all phases are released"
        );
        require(
            block.timestamp >=
                _startDate + _lockDurations[_nextReleaseIdx] * 1 seconds,
            "MeetcapTimeLock: next phase is unavailable"
        );

        uint256 prevReleaseIdx = _nextReleaseIdx;

        uint256 availableReleaseAmount;
        while (
            _nextReleaseIdx < numOfPhases &&
            block.timestamp >=
            _startDate + _lockDurations[_nextReleaseIdx] * 1 seconds
        ) {
            uint256 stepReleaseAmount;
            if (_nextReleaseIdx == numOfPhases - 1) {
                stepReleaseAmount =
                    _amount -
                    _releasedAmount -
                    availableReleaseAmount;
            } else {
                stepReleaseAmount = _amount.mulScale(
                    _releasePercents[_nextReleaseIdx],
                    100
                );
            }

            availableReleaseAmount += stepReleaseAmount;
            _nextReleaseIdx++;
        }

        uint256 balance = token().balanceOf(address(this));
        require(
            balance >= availableReleaseAmount,
            "MeetcapTimeLock: insufficient balance"
        );
        _releasedAmount += availableReleaseAmount;
        token().safeTransfer(beneficiary(), availableReleaseAmount);

        uint64 releaseDate = uint64(block.timestamp);

        for (uint256 i = prevReleaseIdx; i < _nextReleaseIdx; ++i) {
            _releaseDates[i] = releaseDate;
        }

        emit Released(
            availableReleaseAmount,
            _releasedAmount,
            uint32(prevReleaseIdx),
            _nextReleaseIdx - 1,
            releaseDate
        );

        return true;
    }

    /// @dev This is for safety.
    /// For example, when someone setup the contract with wrong data and accidentally transfer token to the lockup contract.
    /// The owner can get the token back by calling this function
    function safeSetup() public onlyOwner returns (bool) {
        uint256 balance = token().balanceOf(address(this));
        token().safeTransfer(owner(), balance);
        emit SafeSetupActivated(balance, owner(), uint64(block.timestamp));
        return true;
    }
}
