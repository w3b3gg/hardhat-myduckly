// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @custom:security-contact marco.bruno.dev@gmail.com
contract Gueio is ERC721, ERC721Enumerable, ERC721Pausable, Ownable, ERC721Burnable {
    uint256 private _nextTokenId;
    uint256 public maxSupply = 512;
    
    bool public isBatch0 = false;
    uint256 public batch0Price = 16 ether;
    uint256 public maxPerWalletBatch0 = 1;

    bool public isBatch1 = false;
    uint256 public batch1Price = 18 ether;
    uint256 public maxPerWalletBatch1 = 1;
    
    bool public isBatch2 = false;
    uint256 public batch2Price = 24 ether;
    uint256 public maxPerWalletBatch2 = 1;

    bool public isBatch3 = false;
    uint256 public batch3Price = 30 ether;
    uint256 public maxPerWalletBatch3 = 1;

    bool public isBatch4 = false;
    uint256 public batch4Price = 40 ether;
    uint256 public maxPerWalletBatch4 = 100;

    mapping(address => bool) public whitelistAddress;

    mapping(address => bool) public batch0Address;
    mapping(address => bool) public batch1Address;
    mapping(address => bool) public batch2Address;
    mapping(address => bool) public batch3Address;
    mapping(address => bool) public batch4Address;

    constructor(address initialOwner)
        ERC721("Gueio", "GO")
        Ownable(initialOwner)
    {}

    function addAddressOnWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 index = 0; index < addresses.length; index++) {
            whitelistAddress[addresses[index]] = true;
        }
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://myduckly.com/api/nft/gueio/";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function openBatch0() public onlyOwner {
        isBatch0 = true; 
    }

    function openBatch1() public onlyOwner {
        isBatch1 = true; 
    }

    function openBatch2() public onlyOwner {
        isBatch2 = true; 
    }

    function openBatch3() public onlyOwner {
        isBatch3 = true; 
    }

    function openBatch4() public onlyOwner {
        isBatch4 = true; 
    }

    function closeBatch0() public onlyOwner {
        isBatch0 = false; 
    }

    function closeBatch1() public onlyOwner {
        isBatch1 = false; 
    }

    function closeBatch2() public onlyOwner {
        isBatch2 = false; 
    }

    function closeBatch3() public onlyOwner {
        isBatch3 = false; 
    }

    function closeBatch4() public onlyOwner {
        isBatch4 = false; 
    }

    function mint(address to, uint256 _amount) external onlyOwner {
        for (uint256 counter; counter < _amount; counter++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function batch0Mint() public payable {
        require(isBatch0, "Batch 0 is close");
        require(!isBatch1, "Batch 1 is open, so you cannot mint from the Batch 1");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 2");
        require(!isBatch3, "Batch 3 is open, so you cannot mint from the Batch 3");
        require(!isBatch4, "Batch 4 is open, so you cannot mint from the Batch 4");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(msg.value == batch0Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(!batch0Address[msg.sender], "You already minted on Batch 0");
        require(balanceOf(msg.sender) < maxPerWalletBatch0, "You already have enough Gueio in your wallet");

        safeMint(msg.sender, 1);
        batch0Address[msg.sender] = true;
    }

    function batch1Mint() public payable {
        require(isBatch1, "Batch 1 is close");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 2");
        require(!isBatch3, "Batch 3 is open, so you cannot mint from the Batch 3");
        require(!isBatch4, "Batch 4 is open, so you cannot mint from the Batch 4");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(msg.value == batch1Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(!batch1Address[msg.sender], 'You already minted on Batch 1');
        require(balanceOf(msg.sender) < maxPerWalletBatch1 || 
            (batch0Address[msg.sender] && balanceOf(msg.sender) < (maxPerWalletBatch0 + maxPerWalletBatch1)),
            "You already have enough Gueio in your wallet"
        );

        safeMint(msg.sender, 1);
        batch1Address[msg.sender] = true;
    }

    function batch2Mint() public payable {
        require(isBatch2, "Batch 2 is close");
        require(!isBatch3, "Batch 3 is open, so you cannot mint from the Batch 3");
        require(!isBatch4, "Batch 4 is open, so you cannot mint from the Batch 4");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(msg.value == batch2Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(!batch2Address[msg.sender], 'You already minted on Batch 2');
        require(balanceOf(msg.sender) < maxPerWalletBatch2 || 
            (
                (batch0Address[msg.sender] || batch1Address[msg.sender]) && 
                balanceOf(msg.sender) < (maxPerWalletBatch0 + maxPerWalletBatch1 + maxPerWalletBatch2)
            ),
            "You already have enough Gueio in your wallet"
        );

        safeMint(msg.sender, 1);
        batch2Address[msg.sender] = true;
    }

    function batch3Mint() public payable {
        require(isBatch3, "Batch 3 is close");
        require(!isBatch4, "Batch 4 is open, so you cannot mint from the Batch 4");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(msg.value == batch3Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(!batch3Address[msg.sender], 'You already minted on Batch 3');
        require(balanceOf(msg.sender) < maxPerWalletBatch3 || 
            (
                (batch0Address[msg.sender] || batch1Address[msg.sender] || batch2Address[msg.sender]) && 
                balanceOf(msg.sender) < (maxPerWalletBatch0 + maxPerWalletBatch1 + maxPerWalletBatch2 + maxPerWalletBatch3)
            ),
            "You already have enough Gueio in your wallet"
        );

        safeMint(msg.sender, 1);
        batch3Address[msg.sender] = true;
    }

    function batch4Mint(uint256 _amount) public payable {
        require(isBatch4, "Batch 4 is close");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(_amount > 0, "The amount cannot be zero or less than zero");
        require(msg.value == batch4Price * _amount, "Not enough funds");
        require(totalSupply() + _amount <= maxSupply, "We sold out!");
        require(!batch4Address[msg.sender], 'You already minted on Batch 4');
        require(balanceOf(msg.sender) < maxPerWalletBatch4 || 
            (
                batch0Address[msg.sender] || batch1Address[msg.sender] && 
                balanceOf(msg.sender) < (maxPerWalletBatch0 + maxPerWalletBatch1 + maxPerWalletBatch2 + maxPerWalletBatch3)
            ),
            "You already have enough Gueio in your wallet"
        );

        safeMint(msg.sender, _amount);
        batch4Address[msg.sender] = true;
    }

    function safeMint(address to, uint256 _amount) internal {
        for (uint256 counter; counter < _amount; counter++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function withdraw(address _address) external onlyOwner {
        uint256 balance = address(this).balance;
        payable(_address).transfer(balance);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
