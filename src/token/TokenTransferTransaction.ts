import { SingleTransactionBuilder } from "../TransactionBuilder";
import { Transaction } from "../generated/Transaction_pb";
import { TransactionResponse } from "../generated/TransactionResponse_pb";
import { grpc } from "@improbable-eng/grpc-web";
import { CryptoTransferTransactionBody } from "../generated/CryptoTransfer_pb";
import { CryptoService } from "../generated/CryptoService_pb_service";
import { AccountAmount, TokenTransferList } from "../generated/BasicTypes_pb";
import BigNumber from "bignumber.js";

import { AccountId, AccountIdLike } from "../account/AccountId";
import { TokenId, TokenIdLike } from "./TokenId";

/**
 * Transfer tokens from some accounts to other accounts. Each negative amount is withdrawn from the corresponding
 * account (a sender), and each positive one is added to the corresponding account (a receiver). All amounts must
 * have sum of zero.
 * Each amount is a number with the lowest denomination possible for a token. Example:
 * Token X has 2 decimals. Account A transfers amount of 100 tokens by providing 10000 as amount in the TransferList.
 * If Account A wants to send 100.55 tokens, he must provide 10055 as amount.
 *
 * If any sender account fails to have sufficient token balance, then the entire transaction fails and none of the
 * transfers occur, though transaction fee is still charged.
 *
 * @deprecated Use `TransferTransaction` instead
 */
export class TokenTransferTransaction extends SingleTransactionBuilder {
    private readonly _body: CryptoTransferTransactionBody;
    private _tokenIdIndexes: Map<string, number>;

    public constructor() {
        super();
        this._body = new CryptoTransferTransactionBody();
        this._tokenIdIndexes = new Map();
        this._body.setTokentransfersList([]);
        this._inner.setCryptotransfer(this._body);

        console.warn("Use `TransferTransaction` instead");
    }

    public addSender(
        tokenId: TokenIdLike,
        accountId: AccountIdLike,
        amount: number | BigNumber
    ): this {
        return this.addTransfer(
            tokenId,
            accountId,
            amount instanceof BigNumber ?
                amount.negated() :
                new BigNumber(amount).negated()
        );
    }

    public addRecipient(
        tokenId: TokenIdLike,
        accountId: AccountIdLike,
        amount: number | BigNumber
    ): this {
        return this.addTransfer(
            tokenId,
            accountId,
            amount instanceof BigNumber ?
                amount :
                new BigNumber(amount)
        );
    }

    public addTransfer(
        tokenId: TokenIdLike,
        accountId: AccountIdLike,
        amount: number | BigNumber
    ): this {
        const index = this._tokenIdIndexes.get(new TokenId(tokenId).toString());
        const token = new TokenId(tokenId);

        if (index == null) {
            this._tokenIdIndexes.set(token.toString(), this._body.getTokentransfersList().length);
        }

        let list;

        if (index != null) {
            list = this._body.getTokentransfersList()[ index ];
        } else {
            list = new TokenTransferList();
            this._body.addTokentransfers(list);
        }

        list.setToken(token._toProto());
        const transfers = list.getTransfersList();

        const acctAmt = new AccountAmount();
        acctAmt.setAccountid(new AccountId(accountId)._toProto());
        acctAmt.setAmount(amount instanceof BigNumber ?
            amount.toString(10) :
            new BigNumber(amount).toString(10));

        transfers.push(acctAmt);

        return this;
    }

    protected _doValidate(_: string[]): void {}

    protected get _method(): grpc.UnaryMethodDefinition<
        Transaction,
        TransactionResponse
        > {
        return CryptoService.cryptoTransfer;
    }
}
