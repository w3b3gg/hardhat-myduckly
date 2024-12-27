// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol"; 
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

/**
* @title MYDLY Token Contract
* @notice ERC20 token implementation for MYDLY with burn and pause capabilities
* @dev Extends ERC20 with burn, permit, pause and ownership features
* @author Marco Bruno <marco.bruno.dev@gmail.com>
*/
contract MYDLY is ERC20, ERC20Burnable, ERC20Permit, ERC20Pausable, Ownable {
    uint256 public immutable TOTAL_SUPPLY = 10_000_000 * 10 ** decimals();

    constructor(address initialOwner) 
        ERC20("MYDLY", "MYDLY")
        ERC20Permit("MYDLY")
        Ownable(initialOwner) 
    {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
} 
