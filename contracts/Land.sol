// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @custom:security-contact marco.bruno.dev@gmail.com
contract Land is ERC721, ERC721Enumerable, ERC721Pausable, Ownable, ERC721Burnable {
    ERC721Enumerable public gueio;
    ERC721Enumerable public appleTree;
    uint256 private _nextTokenId;
    uint256 public maxSupply = 2048;
    
    bool public isBatch0 = false;
    uint256 public batch0Price = 40 ether;
    uint256 public maxPerGueio = 2;

    bool public isBatch1 = false;
    uint256 public batch1Price = 50 ether;
    uint256 public maxPerAppleTree = 1;
    
    bool public isBatch2 = false;
    uint256 public batch2Price = 60 ether;
    uint256 public maxPerWalletBatch2 = 5;

    mapping(address => bool) public batch1Address;
    mapping(address => bool) public batch2Address;

    mapping(uint256 => uint256) public gueioMinted;
    uint256 public amountGueioMinted;

    mapping(uint256 => uint256) public appleTreeMinted ;
    uint256 public amountAppleTreeMinted;

    constructor(address initialOwner, address _gueio, address _appleTree)
        ERC721("Land MyDuckly", "LMD")
        Ownable(initialOwner)
    {
        gueio = ERC721Enumerable(_gueio);
        appleTree = ERC721Enumerable(_appleTree);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://myduckly.com/api/nft/land-myduckly/";
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

            if (gueioMinted[gueioId] < maxPerGueio) {
                return gueioId;
            }
        }

        return 512;
    }

    function hasAppleTreeAvailable(uint256 amountAppleTree) public view returns (uint256) {
        for (uint256 i = 0; i < amountAppleTree; i++) {
            uint256 appleTreeId = appleTree.tokenOfOwnerByIndex(msg.sender, i);

            if (appleTreeMinted[appleTreeId] < maxPerAppleTree) {
                return appleTreeId;
            }
        }

        return 3000;
    }

    function batch0Mint() external payable {
        uint256 amountGueio = gueio.balanceOf(msg.sender);

        require(isBatch0, "Batch 0 is close");
        require(!isBatch1, "Batch 1 is open, so you cannot mint from the Batch 0");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 0");
        require(amountGueio > 0, "You don't have Gueio on your wallet");
        uint256 gueioId = hasGueioAvailable(amountGueio);
        require(gueioId < 512, "You minted all Land with your Gueios");
        require(msg.value == batch0Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");

        safeMint(msg.sender, 1);

        gueioMinted[gueioId]++;
        amountGueioMinted++;
    }

    function batch1Mint() external payable {
        uint256 amountAppleTree = appleTree.balanceOf(msg.sender);

        require(isBatch1, "Batch 1 is close");
        require(!isBatch2, "Batch 2 is open, so you cannot mint from the Batch 2");
        uint256 appleTreeId = hasAppleTreeAvailable(amountAppleTree);
        require(appleTreeId < 3000, "You minted all Land with your Apple Trees");
        require(msg.value == batch1Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");

        safeMint(msg.sender, 1);

        batch1Address[msg.sender] = true;

        appleTreeMinted[appleTreeId]++;
        amountAppleTreeMinted++;
    }

    function batch2Mint() external payable {
        uint256 amountGueio = gueio.balanceOf(msg.sender);
        uint256 amountAppleTree = appleTree.balanceOf(msg.sender);

        require(isBatch2, "Batch 2 is close");
        require(msg.value == batch2Price, "Not enough funds");
        require(totalSupply() < maxSupply, "We sold out!");
        require(balanceOf(msg.sender) < maxPerWalletBatch2 || 
            (
                balanceOf(msg.sender) < (amountGueio + amountAppleTree + maxPerWalletBatch2)
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
