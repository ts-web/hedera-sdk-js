import {
    AccountCreateTransaction,
    AirdropTokenTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TokenType,
    PrivateKey,
    NftId,
    AccountBalanceQuery,
    CustomFixedFee,
    TokenAssociateTransaction,
    TransferTransaction,
    Hbar,
    AccountId,
    TokenId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("AirdropTokenIntegrationTest", function () {
    let env;
    const INITIAL_SUPPLY = 1000;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should transfer tokens when the account is associated", async function () {
        this.timeout(1200000);

        const ftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("FFF")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .execute(env.client);

        const { tokenId: ftTokenId } = await ftCreateResponse.getReceipt(
            env.client,
        );

        const nftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("FFFFF")
            .setTokenSymbol("FFF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyKey(env.operatorKey)
            .setTreasuryAccountId(env.operatorId)
            .execute(env.client);

        const { tokenId: nftTokenId } = await nftCreateResponse.getReceipt(
            env.client,
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateED25519();
        const accountCreateResponse = await new AccountCreateTransaction()
            .setKey(receiverPrivateKey.publicKey)
            .setMaxAutomaticTokenAssociations(-1)
            .execute(env.client);

        const { accountId: receiverId } =
            await accountCreateResponse.getReceipt(env.client);

        // airdrop the tokens
        const transactionResponse = await new AirdropTokenTransaction()
            .addNftTransfer(
                new NftId(nftTokenId, serials[0]),
                env.operatorId,
                receiverId,
            )
            .addTokenTransfer(ftTokenId, receiverId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .execute(env.client);

        await transactionResponse.getReceipt(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );

        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
        //await client.submitTokenAirdrop(transaction);
    });
    it("tokens should be in pending state when no automatic association", async function () {
        this.timeout(1200000);
        const ftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("FFF")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .execute(env.client);

        const { tokenId: ftTokenId } = await ftCreateResponse.getReceipt(
            env.client,
        );

        const nftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("FFFFF")
            .setTokenSymbol("FFF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyKey(env.operatorKey)
            .setTreasuryAccountId(env.operatorId)
            .execute(env.client);

        const { tokenId: nftTokenId } = await nftCreateResponse.getReceipt(
            env.client,
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateED25519();
        const accountCreateResponse = await new AccountCreateTransaction()
            .setKey(receiverPrivateKey.publicKey)
            .execute(env.client);

        const { accountId: receiverId } =
            await accountCreateResponse.getReceipt(env.client);

        const airdropTokenResponse = await new AirdropTokenTransaction()
            .addTokenTransfer(ftTokenId, receiverId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .addNftTransfer(nftTokenId, serials[0], env.operatorId, receiverId)
            .execute(env.client);

        await airdropTokenResponse.getReceipt(env.client);

        const airdropTokenRecord = await airdropTokenResponse.getRecord(
            env.client,
        );

        expect(airdropTokenRecord.newPendingAirdrops.length).to.be.above(0);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);
        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);

        // FT checks
        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );
        expect(receiverBalance.tokens.get(ftTokenId)).to.be.eq(null);

        // NFT checks
        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
        expect(receiverBalance.tokens.get(nftTokenId)).to.be.eq(null);
    });

    it("should create hollow account when airdropping tokens and transfers them", async function () {
        this.timeout(1200000);
        const ftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("FFF")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .execute(env.client);

        const { tokenId: ftTokenId } = await ftCreateResponse.getReceipt(
            env.client,
        );

        const nftCreateResponse = await new TokenCreateTransaction()
            .setTokenName("FFFFF")
            .setTokenSymbol("FFF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .execute(env.client);

        const { tokenId: nftTokenId } = await nftCreateResponse.getReceipt(
            env.client,
        );
        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("metadata"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateED25519();
        const aliasAccountId = receiverPrivateKey.publicKey.toAccountId(0, 0);

        const airdropTokenResponse = await new AirdropTokenTransaction()
            .addTokenTransfer(ftTokenId, aliasAccountId, INITIAL_SUPPLY)
            .addTokenTransfer(ftTokenId, env.operatorId, -INITIAL_SUPPLY)
            .addNftTransfer(
                nftTokenId,
                serials[0],
                env.operatorId,
                aliasAccountId,
            )
            .execute(env.client);

        await airdropTokenResponse.getReceipt(env.client);

        const aliasBalance = await new AccountBalanceQuery()
            .setAccountId(aliasAccountId)
            .execute(env.client);
        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        expect(aliasBalance.tokens.get(ftTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );
        expect(operatorBalance.tokens.get(ftTokenId).toInt()).to.be.eq(0);

        expect(aliasBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
        expect(operatorBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
    });

    it("should airdrop with custom fees", async function () {
        this.timeout(1200000);

        const FEE_AMOUNT = 1;
        const receiverPrivateKey = PrivateKey.generateED25519();
        const createAccountResponse = await new AccountCreateTransaction()
            .setKey(receiverPrivateKey.publicKey)
            .setMaxAutomaticTokenAssociations(-1)
            .execute(env.client);

        const { accountId: receiverId } =
            await createAccountResponse.getReceipt(env.client);

        const feeTokenIdResponse = await new TokenCreateTransaction()
            .setTokenName("fee")
            .setTokenSymbol("FEE")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .execute(env.client);

        const { tokenId: feeTokenId } = await feeTokenIdResponse.getReceipt(
            env.client,
        );

        let customFixedFee = new CustomFixedFee()
            .setFeeCollectorAccountId(env.operatorId)
            .setDenominatingTokenId(feeTokenId)
            .setAmount(FEE_AMOUNT)
            .setAllCollectorsAreExempt(true);

        let tokenWithFee = await new TokenCreateTransaction()
            .setTokenName("tokenWithFee")
            .setTokenSymbol("TWF")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .setCustomFees([customFixedFee])
            .execute(env.client);

        const { tokenId: tokenWithFeeId } = await tokenWithFee.getReceipt(
            env.client,
        );

        let nftTokenWithFee = await new TokenCreateTransaction()
            .setTokenName("tokenWithFee")
            .setTokenSymbol("TWF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setTreasuryAccountId(env.operatorId)
            .setSupplyKey(env.operatorKey)
            .setCustomFees([customFixedFee])
            .execute(env.client);

        const { tokenId: nftTokenId } = await nftTokenWithFee.getReceipt(
            env.client,
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const senderPrivateKey = PrivateKey.generateED25519();
        const { accountId: senderAccountId } = await (
            await new AccountCreateTransaction()
                .setKey(senderPrivateKey.publicKey)
                .setMaxAutomaticTokenAssociations(-1)
                .setInitialBalance(new Hbar(10))
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new TokenAssociateTransaction()
                    .setAccountId(senderAccountId)
                    .setTokenIds([tokenWithFeeId, feeTokenId, nftTokenId])
                    .freezeWith(env.client)
                    .sign(senderPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(
                    tokenWithFeeId,
                    env.operatorId,
                    -INITIAL_SUPPLY,
                )
                .addTokenTransfer(
                    tokenWithFeeId,
                    senderAccountId,
                    INITIAL_SUPPLY,
                )
                .addNftTransfer(
                    nftTokenId,
                    serials[0],
                    env.operatorId,
                    senderAccountId,
                )
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TransferTransaction()
                .addTokenTransfer(feeTokenId, env.operatorId, -INITIAL_SUPPLY)
                .addTokenTransfer(feeTokenId, senderAccountId, INITIAL_SUPPLY)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new AirdropTokenTransaction()
                    .addTokenTransfer(
                        tokenWithFeeId,
                        receiverId,
                        INITIAL_SUPPLY,
                    )
                    .addTokenTransfer(
                        tokenWithFeeId,
                        senderAccountId,
                        -INITIAL_SUPPLY,
                    )
                    .addNftTransfer(
                        nftTokenId,
                        serials[0],
                        senderAccountId,
                        receiverId,
                    )
                    .freezeWith(env.client)
                    .sign(senderPrivateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const operatorBalance = await new AccountBalanceQuery()
            .setAccountId(env.operatorId)
            .execute(env.client);

        // check if fees are collected
        const DISTINCT_TRANSACTIONS = 2;
        expect(operatorBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(0);
        expect(operatorBalance.tokens.get(feeTokenId).toInt()).to.be.eq(
            DISTINCT_TRANSACTIONS,
        );

        const receiverBalance = await new AccountBalanceQuery()
            .setAccountId(receiverId)
            .execute(env.client);
        expect(receiverBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(
            INITIAL_SUPPLY,
        );

        const senderBalance = await new AccountBalanceQuery()
            .setAccountId(senderAccountId)
            .execute(env.client);
        expect(senderBalance.tokens.get(tokenWithFeeId).toInt()).to.be.eq(0);
        expect(senderBalance.tokens.get(feeTokenId).toInt()).to.be.eq(
            INITIAL_SUPPLY - DISTINCT_TRANSACTIONS * FEE_AMOUNT,
        );
        expect(senderBalance.tokens.get(nftTokenId).toInt()).to.be.eq(0);
        expect(receiverBalance.tokens.get(nftTokenId).toInt()).to.be.eq(1);
    });

    it("should not airdrop with receiver sig set to true", async function () {
        this.timeout(1200000);
        const tokenCreateResponse = await new TokenCreateTransaction()
            .setTokenName("FFFFFFFFFF")
            .setTokenSymbol("FFF")
            .setInitialSupply(INITIAL_SUPPLY)
            .setTreasuryAccountId(env.operatorId)
            .execute(env.client);

        const { tokenId } = await tokenCreateResponse.getReceipt(env.client);

        const nftTokenResponse = await new TokenCreateTransaction()
            .setTokenName("FFFFFFFFFF")
            .setTokenSymbol("FFF")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyKey(env.operatorKey)
            .setTreasuryAccountId(env.operatorId)
            .execute(env.client);

        const { tokenId: nftTokenId } = await nftTokenResponse.getReceipt(
            env.client,
        );

        const mintResponse = await new TokenMintTransaction()
            .setTokenId(nftTokenId)
            .addMetadata(Buffer.from("-"))
            .execute(env.client);

        const { serials } = await mintResponse.getReceipt(env.client);

        const receiverPrivateKey = PrivateKey.generateED25519();
        const receiverPublicKey = receiverPrivateKey.publicKey;
        const accountCreateResponse = await (
            await new AccountCreateTransaction()
                .setKey(receiverPublicKey)
                .setReceiverSignatureRequired(true)
                .freezeWith(env.client)
                .sign(receiverPrivateKey)
        ).execute(env.client);

        const { accountId: receiverId } =
            await accountCreateResponse.getReceipt(env.client);

        let err = false;
        try {
            const airdropTokenResponse = await new AirdropTokenTransaction()
                .addTokenTransfer(tokenId, receiverId, INITIAL_SUPPLY)
                .addTokenTransfer(tokenId, env.operatorId, -INITIAL_SUPPLY)
                .addNftTransfer(
                    nftTokenId,
                    serials[0],
                    env.operatorId,
                    receiverId,
                )
                .execute(env.client);

            await airdropTokenResponse.getReceipt(env.client);
        } catch (error) {
            if (error.message.includes("INVALID_SIGNATURE")) {
                err = true;
            }
        }

        expect(err).to.be.eq(true);
    });

    it("should not airdrop with invalid tx body", async function () {
        let err = false;
        const tokenId = new TokenId(1);
        const accountId = new AccountId(1);

        try {
            await (
                await new AirdropTokenTransaction().execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            // SHOULD IT FAIL WITH INVALID TX BODY
            if (error.message.includes("FAIL_INVALID")) {
                err = true;
            }
        }
        expect(err).to.be.eq(true);

        err = false;
        try {
            await (
                await new AirdropTokenTransaction()
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addTokenTransfer(tokenId, accountId, 1)
                    .addNftTransfer(new NftId(tokenId, 1), accountId, accountId)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            if (error.message.includes("INVALID_TRANSACTION_BODY")) {
                err = true;
            }
        }
        expect(err).to.be.eq(true);
    });
});