// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Duckly NFT Contract
 * @notice This contract implements the Duckly NFT collection with various minting options
 * @dev Implements ERC721 with enumerable and URI storage extensions
 * @author Marco Bruno <marco.bruno.dev@gmail.com>
 */
contract Duckly is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Pausable,
    Ownable,
    ERC721Burnable,
    ReentrancyGuard
{
    // Custom errors
    error ExceedsMaxSupply(uint256 requested, uint256 remaining);
    error InsufficientPayment(uint256 provided, uint256 required);
    error MinimumQuantityNotMet(uint256 provided, uint256 required);
    error InvalidQuantity(uint256 quantity);
    error WithdrawFailed();
    error ZeroAddress();
    error ContractPaused();
    error InvalidBaseURI();
    error WithdrawDelayNotMet();
    error NotAuthorized();

    // State variables
    uint96 private _nextTokenId;
    string private _baseURIStorage;
    uint256 public constant MAX_SUPPLY_GENESIS = 4000;
    uint256 public constant PUBLIC_MINT_PRICE = 100 * 10 ** 18;
    uint256 private constant WITHDRAW_DELAY = 24 hours;
    uint256 private lastWithdrawTime;
    
    // Minters mapping
    mapping(address => bool) public minters;

    IERC20 public immutable MYDLY;

    // Events
    event BatchMint(
        address indexed to,
        uint256 startTokenId,
        uint256 quantity,
        uint256 price
    );
    event PaymentProcessed(
        address indexed from,
        uint256 amount,
        uint256 discount
    );
    event WithdrawProcessed(address indexed to, uint256 amount);
    event BaseURIUpdated(string newBaseURI);
    event BatchBurned(address indexed from, uint256[] tokenIds);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // Modifiers
    modifier onlyMinterOrOwner() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    /**
     * @notice Contract constructor
     * @param initialOwner Address of the initial contract owner
     * @param mydly Address of the MYDLY token contract
     */
    constructor(
        address initialOwner,
        address mydly
    ) ERC721("Duckly", "DKY") Ownable(initialOwner) {
        if (mydly == address(0)) revert ZeroAddress();
        MYDLY = IERC20(mydly);
        _baseURIStorage = "https://myduckly.com/api/nft/duckly/";
        lastWithdrawTime = block.timestamp;
    }

    /**
     * @notice Adds a new minter address
     * @param minter Address to be added as minter
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @notice Removes a minter address
     * @param minter Address to be removed from minters
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @notice Returns the base URI for token metadata
     * @return Base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseURIStorage;
    }

    /**
     * @notice Updates the base URI for token metadata
     * @param newBaseURI New base URI string
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        if (bytes(newBaseURI).length == 0) revert InvalidBaseURI();
        _baseURIStorage = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Validates and reserves token IDs for minting
     * @param quantity Number of tokens to reserve
     * @return firstTokenId The first token ID in the reserved range
     */
    function _validateAndReserveTokens(
        uint256 quantity
    ) private returns (uint256 firstTokenId) {
        if (quantity == 0) revert InvalidQuantity(quantity);
        if (paused()) revert ContractPaused();

        uint256 currentSupply = _nextTokenId;
        uint256 newSupply = currentSupply + quantity;

        if (newSupply > MAX_SUPPLY_GENESIS) {
            revert ExceedsMaxSupply({
                requested: quantity,
                remaining: MAX_SUPPLY_GENESIS - currentSupply
            });
        }

        firstTokenId = currentSupply;
        _nextTokenId = uint96(newSupply);
        return firstTokenId;
    }

    /**
     * @notice Processes payment for minting
     * @param quantity Number of tokens being minted
     * @param discountPercent Discount percentage to apply
     */
    function _processPayment(
        uint256 quantity,
        uint256 discountPercent
    ) private {
        uint256 totalPrice = (PUBLIC_MINT_PRICE *
            quantity *
            (100 - discountPercent)) / 100;

        if (MYDLY.allowance(msg.sender, address(this)) < totalPrice) {
            revert InsufficientPayment({
                provided: MYDLY.allowance(msg.sender, address(this)),
                required: totalPrice
            });
        }

        bool success = MYDLY.transferFrom(
            msg.sender,
            address(this),
            totalPrice
        );
        if (!success) revert InsufficientPayment(0, totalPrice);

        emit PaymentProcessed(msg.sender, totalPrice, discountPercent);
    }

    /**
     * @notice Pauses all token transfers and minting
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses all token transfers and minting
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @notice Mints a single token
     * @param to Address to mint the token to
     */
    function safeMint(address to) public nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        uint256 firstTokenId = _validateAndReserveTokens(1);
        _processPayment(1, 0); // 0% discount
        _safeMint(to, firstTokenId);

        emit BatchMint(to, firstTokenId, 1, PUBLIC_MINT_PRICE);
    }

    /**
     * @notice Mints three tokens with a 10% discount
     * @param to Address to mint the tokens to
     */
    function mintThree(address to) public nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        uint256 firstTokenId = _validateAndReserveTokens(3);
        _processPayment(3, 10); // 10% discount

        unchecked {
            for (uint256 i; i < 3; ++i) {
                _safeMint(to, firstTokenId + i);
            }
        }

        emit BatchMint(to, firstTokenId, 3, (PUBLIC_MINT_PRICE * 3 * 90) / 100);
    }

    /**
     * @notice Mints five tokens with a 15% discount
     * @param to Address to mint the tokens to
     */
    function mintFive(address to) public nonReentrant {
        if (to == address(0)) revert ZeroAddress();

        uint256 firstTokenId = _validateAndReserveTokens(5);
        _processPayment(5, 15); // 15% discount

        unchecked {
            for (uint256 i; i < 5; ++i) {
                _safeMint(to, firstTokenId + i);
            }
        }

        emit BatchMint(to, firstTokenId, 5, (PUBLIC_MINT_PRICE * 5 * 85) / 100);
    }

    /**
     * @notice Mints multiple tokens in bulk with a 15% discount
     * @param to Address to mint the tokens to
     * @param quantity Number of tokens to mint (minimum 5)
     */
    function mintBulk(address to, uint256 quantity) public nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        if (quantity < 5) {
            revert MinimumQuantityNotMet({provided: quantity, required: 5});
        }

        uint256 firstTokenId = _validateAndReserveTokens(quantity);
        _processPayment(quantity, 15); // 15% discount

        unchecked {
            for (uint256 i; i < quantity; ++i) {
                _safeMint(to, firstTokenId + i);
            }
        }

        emit BatchMint(
            to,
            firstTokenId,
            quantity,
            (PUBLIC_MINT_PRICE * quantity * 85) / 100
        );
    }

    /**
     * @notice Allows owner or authorized minters to mint tokens without payment
     * @param to Address to mint the tokens to
     * @param quantity Number of tokens to mint
     */
    function offchainMint(
        address to,
        uint256 quantity
    ) public onlyMinterOrOwner {
        if (to == address(0)) revert ZeroAddress();
        if (quantity == 0) revert InvalidQuantity(quantity);

        uint256 firstTokenId = _validateAndReserveTokens(quantity);

        unchecked {
            for (uint256 i; i < quantity; ++i) {
                _safeMint(to, firstTokenId + i);
            }
        }

        emit BatchMint(to, firstTokenId, quantity, 0);
    }

    /**
     * @notice Withdraws accumulated MYDLY tokens to the owner
     * @dev Implements a 24-hour delay between withdrawals
     */
    function withdraw() public onlyOwner nonReentrant {
        if (block.timestamp < lastWithdrawTime + WITHDRAW_DELAY)
            revert WithdrawDelayNotMet();

        uint256 balance = MYDLY.balanceOf(address(this));
        if (balance == 0) revert WithdrawFailed();

        lastWithdrawTime = block.timestamp;

        bool success = MYDLY.transfer(msg.sender, balance);
        if (!success) revert WithdrawFailed();

        emit WithdrawProcessed(msg.sender, balance);
    }

    /**
     * @notice Burns multiple tokens at once
     * @param tokenIds Array of token IDs to burn
     */
    function batchBurn(uint256[] calldata tokenIds) public {
        uint256 length = tokenIds.length;
        for (uint256 i; i < length; ) {
            burn(tokenIds[i]);
            unchecked {
                ++i;
            }
        }
        emit BatchBurned(msg.sender, tokenIds);
    }

    /**
     * @notice Returns the next token ID to be minted
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice Returns the number of tokens that can still be minted
     */
    function remainingTokens() public view returns (uint256) {
        return MAX_SUPPLY_GENESIS - _nextTokenId;
    }

    // Required overrides
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

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
