// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Utilities/Ownable.sol";
import "../Utilities/SafeMathX.sol";
import "../ERC20/IERC20.sol";


contract MeetcapTimeLock is Ownable {
    using SafeMathX for uint256;

    // Beneficiary
    address private _beneficiary;

    // Token address
    IERC20 private _token;

    // Total amount of locked tokens
    uint256 private _totalAllocation;

    // Total amount of tokens have been released
    uint256 private _releasedAmount;

    // Current release phase, starts from 0
    uint32 private _releaseId;

    // Lock duration (in seconds) of each phase
    uint32[] private _lockDurations;

    // Release percent of each phase
    uint32[] private _releasePercents;

    // Dates the beneficiary executes a release for each phase
    uint64[] private _releaseDates;

    // Start date of the lockup period
    uint64 private _startDate;

    event Released(
        uint256 releasableAmount,
        uint32 toIdx
    );

    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    function token() public view virtual returns (IERC20) {
        return _token;
    }

    function totalAllocation() public view virtual returns (uint256) {
        return _totalAllocation;
    }

    function releasedAmount() public view virtual returns (uint256) {
        return _releasedAmount;
    }

    function releaseId() public view virtual returns (uint32) {
        return _releaseId;
    }

    function lockDurations() public view virtual returns (uint32[] memory) {
        return _lockDurations;
    }

    function releasePercents() public view virtual returns (uint32[] memory) {
        return _releasePercents;
    }

    function releaseDates() public view virtual returns (uint64[] memory) {
        return _releaseDates;
    }

    function startDate() public view virtual returns (uint64) {
        return _startDate;
    }

    // This function is created for the purpose of testing 
    function lockData()
        public
        view
        virtual
        returns (
            address owner_,
            address beneficiary_,
            IERC20 token_,
            uint256 totalAllocation_,
            uint256 releasedAmount_,
            uint32 releaseId_,
            uint32[] memory lockDurations_,
            uint32[] memory releasePercents_,
            uint64[] memory releaseDates_,
            uint64 startDate_
        )
    {
        return (
            owner(), 
            beneficiary(),   
            token(),
            totalAllocation(),
            releasedAmount(),
            releaseId(),
            lockDurations(),
            releasePercents(),
            releaseDates(),
            startDate()
        );
    }

    /// Owner is the owner of all lockup contracts who could call safeSetup.
    /// The ownership is renounced right after the setup is done safely.
    function initialize(
        address beneficiary_,
        IERC20 token_,
        uint256 totalAllocation_,
        uint32[] calldata lockDurations_,
        uint32[] calldata releasePercents_,
        uint64 startDate_
    ) public virtual onlyOwner returns (bool) {     
        require(
            lockDurations_.length == releasePercents_.length,
            "Unlock length does not match"
        );

        uint256 _sum;
        for (uint256 i = 0; i < releasePercents_.length; ++i) {
            _sum += releasePercents_[i];
        }

        require(
            _sum == 100, 
            "Total unlock percent is not equal to 100"
        );

        require(
            beneficiary_ != address(0),
            "User address cannot be the zero address"
        );

        require(
            address(token_) != address(0), 
            "Token address cannot be the zero address"
        );

        require(
            totalAllocation_ > 0, 
            "The total allocation must be greater than zero"
        );

        _beneficiary = beneficiary_;
        _token = token_;
        _startDate = startDate_;
        _lockDurations = lockDurations_;
        _releasePercents = releasePercents_;
        _totalAllocation = totalAllocation_;
        _releasedAmount = 0;
        _releaseId = 0;
        _releaseDates = new uint64[](_lockDurations.length);

        return true;
    }

    /// @notice Release unlocked tokens to user.
    /// @dev User (sender) can release unlocked tokens by calling this function.
    /// This function will release locked tokens from multiple lock phases that meets unlock requirements
       function release() public virtual returns (bool) {
        uint256 phases = _lockDurations.length;

        require(
            _releaseId < phases,
            "All phases have already been released"
        );
        require(
            block.timestamp >=
                _startDate + _lockDurations[_releaseId] * 1 seconds,
            "Current time is before release time"
        );

        uint256 preReleaseId = _releaseId;

        uint256 releasableAmount;
        while (
            _releaseId < phases &&
            block.timestamp >=
            _startDate + _lockDurations[_releaseId] * 1 seconds
        ) {
            uint256 stepReleaseAmount;

            if (_releaseId == phases - 1) {
                stepReleaseAmount =
                    _totalAllocation -
                    _releasedAmount -
                    releasableAmount;
            } else {
                stepReleaseAmount = _totalAllocation.mulScale(
                    _releasePercents[_releaseId]
                );
            }

            releasableAmount += stepReleaseAmount;
            _releaseId++;
        }

        _releasedAmount += releasableAmount;
        _token.transfer(_beneficiary, releasableAmount);

        uint64 releaseDate = uint64(block.timestamp);

        for (uint256 i = preReleaseId; i < _releaseId; ++i) {
            _releaseDates[i] = releaseDate;
        }

        emit Released(
            releasableAmount,
            _releaseId
        );

        return true;
    }

    /// @dev This is for safety.
    /// For example, when someone setup the contract with wrong data and accidentally transfer token to the lockup contract.
    /// The owner can get the token back by calling this function.
    /// The ownership is renounced right after the setup is done safely.

    function safeSetup() public virtual onlyOwner returns (bool) {
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(owner(), balance);

        return true;
    }
}
