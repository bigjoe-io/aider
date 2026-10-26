// Minimal ABI for the Leash contract — only the functions/events the CLI uses.
export const LEASH_ABI = [
    // ── views ──────────────────────────────────────────────────────────────────
    {
        name: "getWallet",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "walletId", type: "uint256" }],
        outputs: [
            { name: "owner", type: "address" },
            { name: "balance", type: "uint256" },
            { name: "reserved", type: "uint256" },
            { name: "available", type: "uint256" },
            { name: "paused", type: "bool" },
            { name: "mode", type: "uint8" },
        ],
    },
    {
        name: "getAgent",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "walletId", type: "uint256" },
            { name: "agentAddress", type: "address" },
        ],
        outputs: [
            { name: "label", type: "string" },
            { name: "perPaymentLimit", type: "uint256" },
            { name: "dailyLimit", type: "uint256" },
            { name: "expiresAt", type: "uint256" },
            { name: "active", type: "bool" },
            { name: "spentToday", type: "uint256" },
            { name: "dayStart", type: "uint256" },
        ],
    },
    {
        name: "getRequest",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "requestId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "walletId", type: "uint256" },
                    { name: "agent", type: "address" },
                    { name: "to", type: "address" },
                    { name: "amount", type: "uint256" },
                    { name: "memo", type: "string" },
                    { name: "expiresAt", type: "uint256" },
                    { name: "status", type: "uint8" },
                ],
            },
        ],
    },
    // ── writes ─────────────────────────────────────────────────────────────────
    {
        name: "agentPay",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "walletId", type: "uint256" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "string" },
        ],
        outputs: [],
    },
    {
        name: "requestPayment",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "walletId", type: "uint256" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "memo", type: "string" },
            { name: "ttlSeconds", type: "uint256" },
        ],
        outputs: [{ name: "requestId", type: "uint256" }],
    },
    // ── events ─────────────────────────────────────────────────────────────────
    {
        name: "AgentPaid",
        type: "event",
        inputs: [
            { name: "walletId", type: "uint256", indexed: true },
            { name: "agent", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "memo", type: "string", indexed: false },
        ],
    },
    {
        name: "PaymentRequested",
        type: "event",
        inputs: [
            { name: "requestId", type: "uint256", indexed: true },
            { name: "walletId", type: "uint256", indexed: true },
            { name: "agent", type: "address", indexed: true },
            { name: "to", type: "address", indexed: false },
            { name: "amount", type: "uint256", indexed: false },
            { name: "memo", type: "string", indexed: false },
            { name: "expiresAt", type: "uint256", indexed: false },
        ],
    },
    {
        name: "RequestApproved",
        type: "event",
        inputs: [
            { name: "requestId", type: "uint256", indexed: true },
            { name: "walletId", type: "uint256", indexed: true },
        ],
    },
    {
        name: "RequestRejected",
        type: "event",
        inputs: [
            { name: "requestId", type: "uint256", indexed: true },
            { name: "walletId", type: "uint256", indexed: true },
        ],
    },
    {
        name: "RequestExpired",
        type: "event",
        inputs: [
            { name: "requestId", type: "uint256", indexed: true },
            { name: "walletId", type: "uint256", indexed: true },
        ],
    },
];
//# sourceMappingURL=abi.js.map