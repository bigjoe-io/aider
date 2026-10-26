// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Aider} from "../Aider.sol";

// ---------------------------------------------------------------------------
// Minimal MockERC20 – deployed at a throwaway address then etched into 0x3600…
// ---------------------------------------------------------------------------
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ---------------------------------------------------------------------------
// Shared test base
// ---------------------------------------------------------------------------
abstract contract AiderTestBase is Test {
    address internal constant USDC_ADDR = 0x3600000000000000000000000000000000000000;

    Aider   internal aider;
    MockERC20 internal usdc;

    address internal owner;   // = address(this) in each concrete test
    address internal agent1  = address(0xA1);
    address internal agent2  = address(0xA2);
    address internal recipient = address(0xB1);

    uint256 internal walletId;

    // Default agent limits
    uint256 internal constant PER_PAY  = 10e6;   // 10 USDC
    uint256 internal constant DAILY    = 20e6;   // 20 USDC
    uint256 internal constant EXPIRES0 = 0;      // never

    function setUp() public virtual {
        owner = address(this);

        // Etch mock ERC-20 at the hardcoded USDC address.
        MockERC20 mockImpl = new MockERC20();
        vm.etch(USDC_ADDR, address(mockImpl).code);
        usdc = MockERC20(USDC_ADDR);

        // Deploy Aider (USDC_TOKEN constant now has code behind it).
        aider = new Aider();

        // Seed owner with USDC and unlimited approval.
        usdc.mint(owner, 10_000e6);
        usdc.approve(address(aider), type(uint256).max);

        // Default wallet with 100 USDC deposited.
        walletId = aider.createWallet();
        aider.deposit(walletId, 100e6);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// Add agent1 with default limits (active, never-expires).
    function _addDefaultAgent() internal {
        aider.addAgent(walletId, agent1, "agent1", PER_PAY, DAILY, EXPIRES0);
    }

    /// Have agent1 pay `amount` to `recipient` with memo "m".
    function _agentPay(uint256 amount) internal {
        vm.prank(agent1);
        aider.agentPay(walletId, recipient, amount, "m");
    }

    /// Read (balance, reserved, available) for walletId.
    function _walletState()
        internal
        view
        returns (uint256 balance, uint256 reserved, uint256 available)
    {
        (, balance, reserved, available, ,) = aider.getWallet(walletId);
    }

    /// Read agent1 (spentToday) from getAgent.
    function _spentToday() internal view returns (uint256) {
        (,,,, , uint256 spent,) = aider.getAgent(walletId, agent1);
        return spent;
    }
}
