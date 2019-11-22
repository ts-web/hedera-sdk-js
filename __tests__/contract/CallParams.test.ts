import { CallParams, FunctionSelector } from "../../src/exports";

const utf8 = require("utf8");

describe("CallParams", () => {
    const uint32 = new Uint8Array(4);
    const uint32View = new DataView(uint32.buffer);
    uint32View.setUint32(0, 16909060);

    const bytes = new Uint8Array(10);
    bytes[ 1 ] = 1;
    bytes[ 4 ] = 4;
    bytes[ 9 ] = 8;

    const uint64 = new Uint8Array(8);
    const uint64View = new DataView(uint64.buffer);
    uint64View.setUint32(0, 4294967295);

    const str: string = "this is a grin: \uD83D\uDE01";

    const strArray: string[] = ["one", "two"];

    it("encodes correctly using function selector", () => {
        const func = new FunctionSelector("f")
            .addParamType("uint32")
            .addParamType("bytes")
            .addParamType("uint64")
            .addParamType("bytes")
            .addParamType("string");

        const bytes2 = new Uint8Array(32);
        bytes2[ 0 ] = 255;
        bytes2[ 31 ] = 255;

        const params = new CallParams(func);
        expect(() => params.toProto()).toThrow(new Error("Invalid number of parameters provided"));
        params.addParam(uint32)
            .addParam(bytes)
            .addParam(uint64)
            .addParam(bytes2)
            .addParam(str);

        const finished = params.toProto();
        const funcHash              = Buffer.from(finished.slice(0,  4).buffer).toString("hex");
        const firstParam            = Buffer.from(finished.slice((32 * 0)  + 4, (32 * 1)  + 4).buffer).toString("hex");
        const secondParam           = Buffer.from(finished.slice((32 * 1)  + 4, (32 * 2)  + 4).buffer).toString("hex");
        const thirdParam            = Buffer.from(finished.slice((32 * 2)  + 4, (32 * 3)  + 4).buffer).toString("hex");
        const forthParam            = Buffer.from(finished.slice((32 * 3)  + 4, (32 * 4)  + 4).buffer).toString("hex");
        const fifthParam            = Buffer.from(finished.slice((32 * 4)  + 4, (32 * 5)  + 4).buffer).toString("hex");
        const secondParamDataLength = Buffer.from(finished.slice((32 * 5)  + 4, (32 * 6)  + 4).buffer).toString("hex");
        const secondParamData       = Buffer.from(finished.slice((32 * 6)  + 4, (32 * 7)  + 4).buffer).toString("hex");
        const fourthParamDataLength = Buffer.from(finished.slice((32 * 7)  + 4, (32 * 8)  + 4).buffer).toString("hex");
        const fourthParamData       = Buffer.from(finished.slice((32 * 8)  + 4, (32 * 9)  + 4).buffer).toString("hex");
        const fifthParamDataLength  = Buffer.from(finished.slice((32 * 9)  + 4, (32 * 10) + 4).buffer).toString("hex");
        const fifthParamData        = Buffer.from(finished.slice((32 * 10) + 4, (32 * 11) + 4).buffer).toString("hex");
        expect(funcHash).toStrictEqual("4fec5a19");
        expect(firstParam).toStrictEqual("0000000000000000000000000000000000000000000000000000000001020304");
        expect(secondParam).toStrictEqual("00000000000000000000000000000000000000000000000000000000000000a0");
        expect(thirdParam).toStrictEqual("000000000000000000000000000000000000000000000000ffffffff00000000");
        expect(forthParam).toStrictEqual("00000000000000000000000000000000000000000000000000000000000000e0");
        expect(fifthParam).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000120");
        expect(secondParamDataLength).toStrictEqual("000000000000000000000000000000000000000000000000000000000000000a");
        expect(secondParamData).toStrictEqual("0001000004000000000800000000000000000000000000000000000000000000");
        expect(fourthParamDataLength).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000020");
        expect(fourthParamData).toStrictEqual("ff000000000000000000000000000000000000000000000000000000000000ff");
        expect(fifthParamDataLength).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000014");
        expect(fifthParamData).toStrictEqual("746869732069732061206772696e3a20f09f9881000000000000000000000000");
        expect(finished).toHaveLength(356);
    });

    it("encodes correctly using generic addParam", () => {
        const params = new CallParams()
            .setFunction("f")
            .addParam(uint32)
            .addParam(bytes)
            .addParam(uint64)
            .addParam(str)
            .addParam(1515)
            .addParam(strArray);

        const finished = params.toProto();
        const funcHash              = Buffer.from(finished.slice(0,  4).buffer).toString("hex");
        const firstParam            = Buffer.from(finished.slice((32 * 0)  + 4, (32 * 1)  + 4).buffer).toString("hex");
        const secondParam           = Buffer.from(finished.slice((32 * 1)  + 4, (32 * 2)  + 4).buffer).toString("hex");
        const thirdParam            = Buffer.from(finished.slice((32 * 2)  + 4, (32 * 3)  + 4).buffer).toString("hex");
        const forthParam            = Buffer.from(finished.slice((32 * 3)  + 4, (32 * 4)  + 4).buffer).toString("hex");
        const fifthParam            = Buffer.from(finished.slice((32 * 4)  + 4, (32 * 5)  + 4).buffer).toString("hex");
        const sixthParam            = Buffer.from(finished.slice((32 * 5)  + 4, (32 * 6)  + 4).buffer).toString("hex");
        const fourthParamDataLength = Buffer.from(finished.slice((32 * 6)  + 4, (32 * 7)  + 4).buffer).toString("hex");
        const fourthParamData       = Buffer.from(finished.slice((32 * 7)  + 4, (32 * 8)  + 4).buffer).toString("hex");
        const sixthParamDataLength  = Buffer.from(finished.slice((32 * 8)  + 4, (32 * 9)  + 4).buffer).toString("hex");
        const sixthParamFirstElOff  = Buffer.from(finished.slice((32 * 9)  + 4, (32 * 10) + 4).buffer).toString("hex");
        const sixthParamSecondElOff = Buffer.from(finished.slice((32 * 10) + 4, (32 * 11) + 4).buffer).toString("hex");
        const sixthParamFirstElLen  = Buffer.from(finished.slice((32 * 11) + 4, (32 * 12) + 4).buffer).toString("hex");
        const sixthParamFirstEl     = Buffer.from(finished.slice((32 * 12) + 4, (32 * 13) + 4).buffer).toString("hex");
        const sixthParamSecondElLen = Buffer.from(finished.slice((32 * 13) + 4, (32 * 14) + 4).buffer).toString("hex");
        const sixthParamSecondEl    = Buffer.from(finished.slice((32 * 14) + 4, (32 * 15) + 4).buffer).toString("hex");
        expect(funcHash).toStrictEqual("d4dbd767");
        expect(firstParam).toStrictEqual("0000000000000000000000000000000000000000000000000000000001020304");
        expect(secondParam).toStrictEqual("0001000004000000000800000000000000000000000000000000000000000000");
        expect(thirdParam).toStrictEqual("000000000000000000000000000000000000000000000000ffffffff00000000");
        expect(forthParam).toStrictEqual("00000000000000000000000000000000000000000000000000000000000000c0");
        expect(fifthParam).toStrictEqual("00000000000000000000000000000000000000000000000000000000000005eb");
        expect(sixthParam).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000100");
        expect(fourthParamDataLength).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000014");
        expect(fourthParamData).toStrictEqual("746869732069732061206772696e3a20f09f9881000000000000000000000000");
        expect(sixthParamDataLength).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000002");
        expect(sixthParamFirstElOff).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000040");
        expect(sixthParamSecondElOff).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000080");
        expect(sixthParamFirstElLen).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000003");
        expect(sixthParamFirstEl).toStrictEqual("6f6e650000000000000000000000000000000000000000000000000000000000");
        expect(sixthParamSecondElLen).toStrictEqual("0000000000000000000000000000000000000000000000000000000000000003");
        expect(sixthParamSecondEl).toStrictEqual("74776f0000000000000000000000000000000000000000000000000000000000");
        expect(finished).toHaveLength(484);
    });
});
