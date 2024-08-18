// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Duckly is ERC721, ERC721Enumerable, ERC721Pausable, Ownable {
    ERC721Enumerable public gueio;
    ERC721Enumerable public appleTree;
    uint256 private _nextTokenId = 0;
    uint256 public maxSupply = 2048;

    bool public isBatchGueioHolders = false;
    uint256 public gueioHolderPrice = 16 ether;
    uint256 public maxPerWalletGueioHolder = 2;

    bool public isBatchAppleTreeHolders = false;
    uint256 public appleTreeHolderPrice = 18 ether;
    uint256 public maxPerWalletAppleTreeHolder = 1;

    bool public isBatchOpen = false;
    uint256 public openPrice = 20 ether;
    uint256 public maxPerWalletOpen = 10;

    mapping(uint256 => uint256) public gueioMinted;
    mapping(uint256 => uint256) public appleTreeMinted;
    mapping(address => uint256) public openMinted;
    uint256 public mintedWithGueio = 0;
    uint256 public mintedWithAppleTree = 0;
    uint256 public mintedOpen = 0;

    constructor(
        address initialOwner,
        ERC721Enumerable gueioAddress,
        ERC721Enumerable appleTreeAddress
    ) ERC721("Duckly", "DKY") Ownable(initialOwner) {
        gueio = ERC721Enumerable(gueioAddress);
        appleTree = ERC721Enumerable(appleTreeAddress);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://localhost:7071/api/nfts/duckly";
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId);
    }

    function openBatchGueioHolders() public onlyOwner {
        isBatchGueioHolders = true;
    }
    
    function openBatchAppleTreeHolders() public onlyOwner {
        isBatchAppleTreeHolders = true;
    }

    function openBatchOpen() public onlyOwner {
        isBatchOpen = true;
    }

    function closeBatchGueioHolders() public onlyOwner {
        isBatchGueioHolders = false;
    }

    function closeBatchAppleTreeHolders() public onlyOwner {
        isBatchAppleTreeHolders = false;
    }

    function closeBatchOpen() public onlyOwner {
        isBatchOpen = false;
    }

    function hasGueioAvailable() public view returns (uint256, uint256, uint256[] memory) {
        if (isBatchGueioHolders) {
            uint256 amountGueio = gueio.balanceOf(msg.sender);
            
            uint256 counter = 0;
            uint256 counterMint = 0;
            for (uint256 i = 0; i < amountGueio; i++) {
                uint256 gueioId = gueio.tokenOfOwnerByIndex(msg.sender, i);
                
                if (gueioMinted[gueioId] < maxPerWalletGueioHolder) {
                    counter++;

                    if (gueioMinted[gueioId] == 0) counterMint += 2;
                    if (gueioMinted[gueioId] == 1) counterMint++;
                }
            }

            uint256[] memory gueioIdsAvailable = new uint256[](counter);
            uint256 index = 0;
            for (uint256 i = 0; i < amountGueio; i++) {
                uint256 gueioId = gueio.tokenOfOwnerByIndex(msg.sender, i);

                if (gueioMinted[gueioId] < maxPerWalletGueioHolder) {
                    gueioIdsAvailable[index] = gueioId;
                    index++;
                }
            }

            return (counter, counterMint, gueioIdsAvailable);
        }

        return (0, 0, new uint256[](0));
    }

    function hasAppleTreeAvailable() public view returns (uint256, uint256, uint256[] memory) {
        if (isBatchAppleTreeHolders) {
            uint256 amountAppleTree = appleTree.balanceOf(msg.sender);
            
            uint256 counter = 0;
            uint256 counterMint = 0;
            for (uint256 i = 0; i < amountAppleTree; i++) {
                uint256 appleTreeId = appleTree.tokenOfOwnerByIndex(msg.sender, i);
                
                if (appleTreeMinted[appleTreeId] < maxPerWalletAppleTreeHolder) {
                    counter++;

                    if (appleTreeMinted[appleTreeId] == 0) counterMint++;
                }
            }

            uint256[] memory appleTreeIdsAvailable = new uint256[](counter);
            uint256 index = 0;
            for (uint256 i = 0; i < amountAppleTree; i++) {
                uint256 appleTreeId = appleTree.tokenOfOwnerByIndex(msg.sender, i);
                
                if (appleTreeMinted[appleTreeId] < maxPerWalletAppleTreeHolder) {
                    appleTreeIdsAvailable[index] = appleTreeId;
                    index++;
                }
            }

            return (counter, counterMint, appleTreeIdsAvailable);
        }

        return (0, 0, new uint256[](0));
    }

    function mint(uint256 amount) public payable {
        require(amount > 0, 'You need to send the amount');
        require(totalSupply() + amount <= maxSupply, 'Sold out');
        (uint256 amountGueioAvailable, uint256 amountCanMintWithGueio, uint256[] memory gueioIds) = hasGueioAvailable();
        (uint256 amountAppleTreeAvailable, uint256 amountCanMintWithAppleTree, uint256[] memory appleTreeIds) = hasAppleTreeAvailable();

        uint256 remainingAmount = amount;
        uint256 amountGueioMinted = 0;
        uint256 amountAppleTreeMinted = 0;
        uint256 amountOpenMinted = 0;
        uint256 totalPrice = 0;
        
        if (amountCanMintWithGueio > 0) {
            if (amountCanMintWithGueio == remainingAmount) {
                totalPrice += remainingAmount * gueioHolderPrice;
                amountGueioMinted = remainingAmount;
                remainingAmount = 0;
            } else if (amountCanMintWithGueio > remainingAmount) {
                totalPrice += remainingAmount * gueioHolderPrice;
                amountGueioMinted = remainingAmount;
                remainingAmount = 0;
            } else if (amountCanMintWithGueio < remainingAmount) {
                totalPrice += amountCanMintWithGueio * gueioHolderPrice;
                amountGueioMinted = amountCanMintWithGueio;
                remainingAmount -= amountGueioMinted;
            }
        }

        if (amountCanMintWithAppleTree > 0) {
            if (amountCanMintWithAppleTree == remainingAmount) {
                totalPrice += remainingAmount * appleTreeHolderPrice;
                amountAppleTreeMinted = remainingAmount;
                remainingAmount = 0;
            } else if (amountCanMintWithAppleTree > remainingAmount) {
                totalPrice += remainingAmount * appleTreeHolderPrice;
                amountAppleTreeMinted = remainingAmount;
                remainingAmount = 0;
            } else if (amountCanMintWithAppleTree < remainingAmount) {
                totalPrice += amountCanMintWithAppleTree * appleTreeHolderPrice;
                amountAppleTreeMinted = amountCanMintWithAppleTree;
                remainingAmount -= amountAppleTreeMinted;
            }
        }

        if (remainingAmount > 0) {
            require(isBatchOpen, 'Batch open is close');            
            require(
                openMinted[msg.sender] + remainingAmount <= maxPerWalletOpen, 
                "Minted 10 Ducklys, you can't mint any more"
            );
            totalPrice += remainingAmount * openPrice;
            amountOpenMinted = remainingAmount;
            openMinted[msg.sender] = amountOpenMinted;
            remainingAmount = 0;
        }

        require(msg.value == totalPrice, 'Not enough founds');

        uint256 mintedWithGueioNow = 0;
        for (uint256 index = 0; index < amountGueioAvailable && mintedWithGueioNow < amountCanMintWithGueio; index++) {
            if (gueioMinted[gueioIds[index]] < maxPerWalletGueioHolder) {
                if (mintedWithGueioNow < amount) {
                    if (gueioMinted[gueioIds[index]] == 1) {
                        gueioMinted[gueioIds[index]]++;
                        mintedWithGueioNow++;
                        mintedWithGueio++;
                    } else if (gueioMinted[gueioIds[index]] == 0) {
                        if ((amount - mintedWithGueioNow) == 1) {
                            gueioMinted[gueioIds[index]]++;
                            mintedWithGueioNow++;
                            mintedWithGueio++;
                        } else {
                            gueioMinted[gueioIds[index]] += 2;
                            mintedWithGueioNow += 2;
                            mintedWithGueio += 2;
                        }
                    }
                }
            }
        }

        uint256 mintedWithAppleTreeNow = 0;
        for (uint256 index = 0; index < amountAppleTreeAvailable && mintedWithAppleTreeNow < amountCanMintWithAppleTree; index++) {
            
            if (appleTreeMinted[appleTreeIds[index]] < maxPerWalletAppleTreeHolder) {
                appleTreeMinted[appleTreeIds[index]]++;
                mintedWithAppleTreeNow++;
                mintedWithAppleTree++;
            }
        }

        mintedOpen += amountOpenMinted;

        for (uint256 index = 0; index < amount; index++) {
            safeMint(msg.sender, _nextTokenId++);
        }
    }

    function mintTo(address to, uint256 amount) public onlyOwner {
        for (uint256 index = 0; index < amount; index++) {
            safeMint(to, _nextTokenId++);
        }
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    )
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
