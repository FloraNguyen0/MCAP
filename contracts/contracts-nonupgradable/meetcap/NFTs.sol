// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../token/ERC721/ERC721.sol";
import "../access/Ownable.sol";
import "../utils/Counters.sol";
import "../token/ERC721/extensions/ERC721URIStorage.sol";
import "../../contracts-upgradable/token/ERC20/IERC20Upgradeable.sol";

contract MeetcapNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // price per NFT (to ERC20 token units)
    uint256 private _price;

    // ERC20 token used for minting NFTs
    IERC20Upgradeable private _token;

    event MintSuccess(address indexed sender, uint256 NFTAmount, string uri);

    constructor(uint256 price_, IERC20Upgradeable token_) ERC721("MeetcapNFT", "MCN") {
        require(price_ > 0, "Token price cannot be 0");
        require(address(token_) != address(0), "Token address cannot be the zero address");

        _price = price_;
        _token = token_;
    }

    function price() public view virtual returns (uint256) {
        return _price;
    }

    function token() public view virtual returns (IERC20Upgradeable) {
        return _token;
    }

    // Allows updating token URIs for individual token IDs.
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // uri is a string that resolves to a JSON document that describes the NFT's metadata
    function mintNFTs(
        address _to,
        string memory _uri,
        uint256 _amount
    ) public virtual returns (bool) {
        _mintNFTs(_to, _uri, _amount);
        return true;
    }

    function _mintNFTs(
        address _to,
        string memory _uri,
        uint256 _amount
    ) internal {
        require(_amount > 0, "Cannot mint 0 NFT");

        // Transfer ERC20 tokens to the NFT contract
        require(
            _token.transferFrom(_to, address(this), _price * _amount),
            "Transfering the Coin tokens to the NFT contract failed"
        );

        // Transfer NFT(s) to the beneficiery
        for (uint256 i = 0; i < _amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(_to, tokenId);
            _setTokenURI(tokenId, _uri);
        }

        emit MintSuccess(_to, _amount, _uri);
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
