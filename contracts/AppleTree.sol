// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @custom:security-contact marco.bruno.dev@gmail.com
contract AppleTree is ERC721, ERC721Enumerable, ERC721Pausable, Ownable, ERC721Burnable {
    ERC721Enumerable public gueio;
    uint256 private _nextTokenId;
    uint256 public maxSupply = 3000;
    
    bool public isBatch0 = false;
    uint256 public batch0Price = 1 ether;

    bool public isBatch1 = false;
    uint256 public batch1Price = 1 ether;
    uint256 public maxPerWalletBatch1 = 1;
    
    bool public isBatch2 = false;
    uint256 public batch2Price = 1 ether;
    uint256 public maxPerWalletBatch2 = 5;

    mapping(address => bool) public whitelistAddress;

    mapping(address => bool) public batch1Address;
    mapping(address => bool) public batch2Address;

    mapping(uint256 => bool) public gueioMinted;
    uint256 public amountGueioMinted;

    constructor(address initialOwner, address _gueio)
        ERC721("AppleTree", "APPT")
        Ownable(initialOwner)
    {
        gueio = ERC721Enumerable(_gueio);
    }

    function addAddressOnWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 index = 0; index < addresses.length; index++) {
            whitelistAddress[addresses[index]] = true;
        }
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://myduckly.com/api/nft/appletree/";
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

    function closeBatch0() public onlyOwner {
        isBatch0 = false; 
    }

    function closeBatch1() public onlyOwner {
        isBatch1 = false; 
    }

    function closeBatch2() public onlyOwner {
        isBatch2 = false; 
    }

    function hasGueioAvailable(uint256 amountGueio) public view returns (uint256) {
        for (uint256 i = 0; i < amountGueio; i++) {
            uint256 gueioId = gueio.tokenOfOwnerByIndex(msg.sender, i);

            if (!gueioMinted[gueioId]) {
                return gueioId;
            }
        }

        return 512;
    }

    function batch0Mint() external payable {
        uint256 amountGueio = gueio.balanceOf(msg.sender);

        require(isBatch0, "Batch 0 is close");
        require(!isBatch1, "Batch 1 is open, so you cannot mint from the Batch 0");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 0");
        require(amountGueio > 0, "You don't have Gueio on your wallet");
        uint256 gueioId = hasGueioAvailable(amountGueio);
        require(gueioId < 512, "You minted all Apple Trees with your Gueios");
        require(msg.value == batch0Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");

        safeMint(msg.sender, 1);

        gueioMinted[gueioId] = true;
        amountGueioMinted++;
    }

    function batch1Mint() external payable {
        uint256 amountGueio = gueio.balanceOf(msg.sender);

        require(isBatch1, "Batch 1 is close");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 2");
        require(whitelistAddress[msg.sender], "You are not on the allow whitelist");
        require(msg.value == batch1Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(!batch1Address[msg.sender], 'You already minted on Batch 1');
        require(balanceOf(msg.sender) < maxPerWalletBatch1 || 
            (balanceOf(msg.sender) < (amountGueio + maxPerWalletBatch1)),
            "You already have enough Apple Tree in your wallet"
        );

        safeMint(msg.sender, 1);
        batch1Address[msg.sender] = true;
    }

    function batch2Mint() external payable {
        uint256 amountGueio = gueio.balanceOf(msg.sender);

        require(isBatch2, "Batch 2 is close");
        require(msg.value == batch2Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(balanceOf(msg.sender) < maxPerWalletBatch2 || 
            (
                balanceOf(msg.sender) < (amountGueio + maxPerWalletBatch1 + maxPerWalletBatch2)
            ),
            "You already have enough Apple Tree in your wallet"
        );

        safeMint(msg.sender, 1);
        batch2Address[msg.sender] = true;
    }

    function safeMint(address to, uint256 _amount) internal {
        for (uint256 counter; counter < _amount; counter++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    function mint(address to, uint256 _amount) external onlyOwner {
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
