export declare const LEASH_ABI: readonly [{
    readonly name: "getWallet";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "balance";
        readonly type: "uint256";
    }, {
        readonly name: "reserved";
        readonly type: "uint256";
    }, {
        readonly name: "available";
        readonly type: "uint256";
    }, {
        readonly name: "paused";
        readonly type: "bool";
    }, {
        readonly name: "mode";
        readonly type: "uint8";
    }];
}, {
    readonly name: "getAgent";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "label";
        readonly type: "string";
    }, {
        readonly name: "perPaymentLimit";
        readonly type: "uint256";
    }, {
        readonly name: "dailyLimit";
        readonly type: "uint256";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }, {
        readonly name: "spentToday";
        readonly type: "uint256";
    }, {
        readonly name: "dayStart";
        readonly type: "uint256";
    }];
}, {
    readonly name: "getRequest";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "walletId";
            readonly type: "uint256";
        }, {
            readonly name: "agent";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "memo";
            readonly type: "string";
        }, {
            readonly name: "expiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }];
    }];
}, {
    readonly name: "agentPay";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "string";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "requestPayment";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "string";
    }, {
        readonly name: "ttlSeconds";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
}, {
    readonly name: "AgentPaid";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "memo";
        readonly type: "string";
        readonly indexed: false;
    }];
}, {
    readonly name: "PaymentRequested";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "memo";
        readonly type: "string";
        readonly indexed: false;
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly name: "RequestApproved";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
}, {
    readonly name: "RequestRejected";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
}, {
    readonly name: "RequestExpired";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
}];
//# sourceMappingURL=abi.d.ts.map