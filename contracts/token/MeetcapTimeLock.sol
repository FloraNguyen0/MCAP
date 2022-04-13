// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Utilities/Ownable.sol";
import "../Utilities/SafeMathX.sol";
import "../BEP20/IBEP20.sol";


contract MeetcapTimeLock is Ownable {
    using SafeMathX for uint256;

    // Beneficiary
    address private _beneficiary;

    // Token address
    IBEP20 private _token;

    // Total amount of tokens had been locked initially
    uint256 private _amount;

    // Total amount of tokens have been released
    uint256 private _totalReleasedAmount;

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
    
    // Initialized status
    bool private _isInitialized = false;

    event Released(
        uint256 releasedAmount,
        uint256 _totalReleasedAmount,
        uint32 toIdx,
        uint64 date
    );

    event SafeSetupActivated(uint256 amount, address to, uint64 date);

    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    function token() public view virtual returns (IBEP20) {
        return _token;
    }

    function amount() public view virtual returns (uint256) {
        return _amount;
    }

    function totalReleasedAmount() public view virtual returns (uint256) {
        return _totalReleasedAmount;
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

    function isInitialized() public view virtual returns (bool){
        return _isInitialized;
    }

    // This function is created for the purpose of testing 
    function lockData()
        public
        view
        virtual
        returns (
            address owner_,
            address beneficiary_,
            IBEP20 token_,
            uint256 amount_,
            uint256 totalReleasedAmount_,
            uint32 releaseId_,
            uint32[] memory lockDurations_,
            uint32[] memory releasePercents_,
            uint64[] memory releaseDates_,
            uint64 startDate_,
            bool isInitialized_
        )
    {
        return (
            owner(), 
            beneficiary(),   
            token(),
            amount(),
            totalReleasedAmount(),
            releaseId(),
            lockDurations(),
            releasePercents(),
            releaseDates(),
            startDate(),
            isInitialized()
        );
    }

    /// Owner is the owner of all lockup contracts who could call safeSetup, not the deployer (see transferOwnership),
    /// The ownership is renounced after the setup is done safely
    function initialize(
        address owner_,
        address beneficiary_,
        IBEP20 token_,
        uint256 amount_,
        uint32[] calldata lockDurations_,
        uint32[] calldata releasePercents_,
        uint64 startDate_
    ) public virtual returns (bool) {
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

        require(
            _sum == 100, 
            "TokenTimeLock: unlock percent sum is not equal to 100"
        );

        require(
            beneficiary_ != address(0),
            "TokenTimeLock: user address is zero"
        );

        require(
            address(token_) != address(0), 
            "TokenTimeLock: token address is zero"
        );

        require(
            owner_ != address(0),
            "TokenTimeLock: owner address is zero"
        );

        require(
            amount_ > 0, 
            "TokenTimeLock: The amount must be greater than zero"
        );

        _beneficiary = beneficiary_;
        _token = token_;
        _startDate = startDate_;
        _lockDurations = lockDurations_;
        _releasePercents = releasePercents_;
        _amount = amount_;
        _totalReleasedAmount = 0;
        _releaseId = 0;
        _releaseDates = new uint64[](_lockDurations.length);

        transferOwnership(owner_);

        return true;
    }

    /// @notice Release unlocked tokens to user.
    /// @dev User (sender) can release unlocked tokens by calling this function.
    /// This function will release locked tokens from multiple lock phases that meets unlock requirements
   
    function release() public virtual returns (bool) {
        uint256 phases = _lockDurations.length;

        require(
            _releaseId < phases,
            "MeetcapTimeLock: all phases have already been released"
        );
        require(
            block.timestamp >=
                _startDate + _lockDurations[_releaseId] * 1 seconds,
            "MeetcapTimeLock: next phase is unavailable"
        );

        uint256 preReleaseId = _releaseId;

        uint256 releasedAmount;
        while (
            _releaseId < phases &&
            block.timestamp >=
            _startDate + _lockDurations[_releaseId] * 1 seconds
        ) {
            uint256 stepReleaseAmount;
            if (_releaseId == phases - 1) {
                stepReleaseAmount =
                    _amount -
                    _totalReleasedAmount -
                    releasedAmount;
            } else {
                stepReleaseAmount = _amount.mulScale(
                    _releasePercents[_releaseId],
                    100
                );
            }

            releasedAmount += stepReleaseAmount;
            _releaseId++;
        }

        uint256 balance = _token.balanceOf(address(this));
        require(
            balance >= releasedAmount,
            "MeetcapTimeLock: insufficient balance"
        );
        _totalReleasedAmount += releasedAmount;
        _token.transfer(_beneficiary, releasedAmount);

        uint64 releaseDate = uint64(block.timestamp);

        for (uint256 i = preReleaseId; i < _releaseId; ++i) {
            _releaseDates[i] = releaseDate;
        }

        emit Released(
            releasedAmount,
            _totalReleasedAmount,
            _releaseId,
            releaseDate
        );

        return true;
    }

    /// @dev This is for safety.
    /// For example, when someone setup the contract with wrong data and accidentally transfer token to the lockup contract.
    /// The owner can get the token back by calling this function.
    /// The ownership is renounced after the setup is done safely.

    function safeSetup() public virtual onlyOwner returns (bool) {
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(owner(), balance);
        emit SafeSetupActivated(balance, owner(), uint64(block.timestamp));
        return true;
    }
}
