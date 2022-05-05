// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../token/ERC721/ERC721.sol";
import "../access/Ownable.sol";
import "../utils/Counters.sol";
import "../token/ERC721/extensions/ERC721URIStorage.sol";

//  Auto Increment Ids, mintable
contract MeetcapNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("MeetcapNFT", "MCN") {}

// string memory tokenURI is a string that should resolve 
// to a JSON document that describes the NFT's metadata
    function safeMint(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Allows updating token URIs for individual token IDs.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}



