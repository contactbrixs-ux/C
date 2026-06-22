import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBYTUMUWK5HWAQUYCMM7SQN73WKZYVARS6ZVNDRBDDUM4K7XGQFSWBVZ",
  }
} as const

export const Errors = {
  1: {message:"CampaignNotFound"},
  2: {message:"AlreadyWithdrawn"},
  3: {message:"DeadlinePassed"},
  4: {message:"DeadlineNotPassed"},
  5: {message:"GoalNotMet"},
  6: {message:"GoalAlreadyMet"},
  7: {message:"NoContribution"}
}

export type DataKey = {tag: "Campaign", values: readonly [u64]} | {tag: "Contribution", values: readonly [u64, string]} | {tag: "CampaignCount", values: void} | {tag: "CampaignIds", values: void};


export interface Campaign {
  creator: string;
  deadline: u64;
  goal: i128;
  title: string;
  token: string;
  total_raised: i128;
  withdrawn: boolean;
}

export interface Client {
  /**
   * Construct and simulate a refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Refund a contributor (after deadline, goal not met).
   */
  refund: ({campaign_id, contributor}: {campaign_id: u64, contributor: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Withdraw all raised funds (creator only, after deadline, goal met).
   */
  withdraw: ({campaign_id}: {campaign_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a contribute transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Contribute `amount` tokens to a campaign.
   * Transfers tokens from contributor to the contract.
   */
  contribute: ({contributor, campaign_id, amount}: {contributor: string, campaign_id: u64, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get campaign details.
   */
  get_campaign: ({campaign_id}: {campaign_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Campaign>>

  /**
   * Construct and simulate a create_campaign transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new crowdfunding campaign. Returns the campaign ID.
   */
  create_campaign: ({creator, title, goal, deadline, token}: {creator: string, title: string, goal: i128, deadline: u64, token: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_campaign_ids transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get all campaign IDs.
   */
  get_campaign_ids: (options?: MethodOptions) => Promise<AssembledTransaction<Array<u64>>>

  /**
   * Construct and simulate a get_contribution transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get a contributor's contribution amount for a campaign.
   */
  get_contribution: ({campaign_id, contributor}: {campaign_id: u64, contributor: string}, options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_campaign_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total number of campaigns.
   */
  get_campaign_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABwAAAAAAAAAQQ2FtcGFpZ25Ob3RGb3VuZAAAAAEAAAAAAAAAEEFscmVhZHlXaXRoZHJhd24AAAACAAAAAAAAAA5EZWFkbGluZVBhc3NlZAAAAAAAAwAAAAAAAAARRGVhZGxpbmVOb3RQYXNzZWQAAAAAAAAEAAAAAAAAAApHb2FsTm90TWV0AAAAAAAFAAAAAAAAAA5Hb2FsQWxyZWFkeU1ldAAAAAAABgAAAAAAAAAOTm9Db250cmlidXRpb24AAAAAAAc=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAACENhbXBhaWduAAAAAQAAAAYAAAABAAAAAAAAAAxDb250cmlidXRpb24AAAACAAAABgAAABMAAAAAAAAAAAAAAA1DYW1wYWlnbkNvdW50AAAAAAAAAAAAAAAAAAALQ2FtcGFpZ25JZHMA",
        "AAAAAAAAADRSZWZ1bmQgYSBjb250cmlidXRvciAoYWZ0ZXIgZGVhZGxpbmUsIGdvYWwgbm90IG1ldCkuAAAABnJlZnVuZAAAAAAAAgAAAAAAAAALY2FtcGFpZ25faWQAAAAABgAAAAAAAAALY29udHJpYnV0b3IAAAAAEwAAAAA=",
        "AAAAAQAAAAAAAAAAAAAACENhbXBhaWduAAAABwAAAAAAAAAHY3JlYXRvcgAAAAATAAAAAAAAAAhkZWFkbGluZQAAAAYAAAAAAAAABGdvYWwAAAALAAAAAAAAAAV0aXRsZQAAAAAAABAAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAMdG90YWxfcmFpc2VkAAAACwAAAAAAAAAJd2l0aGRyYXduAAAAAAAAAQ==",
        "AAAAAAAAAENXaXRoZHJhdyBhbGwgcmFpc2VkIGZ1bmRzIChjcmVhdG9yIG9ubHksIGFmdGVyIGRlYWRsaW5lLCBnb2FsIG1ldCkuAAAAAAh3aXRoZHJhdwAAAAEAAAAAAAAAC2NhbXBhaWduX2lkAAAAAAYAAAAA",
        "AAAAAAAAAFxDb250cmlidXRlIGBhbW91bnRgIHRva2VucyB0byBhIGNhbXBhaWduLgpUcmFuc2ZlcnMgdG9rZW5zIGZyb20gY29udHJpYnV0b3IgdG8gdGhlIGNvbnRyYWN0LgAAAApjb250cmlidXRlAAAAAAADAAAAAAAAAAtjb250cmlidXRvcgAAAAATAAAAAAAAAAtjYW1wYWlnbl9pZAAAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAABVHZXQgY2FtcGFpZ24gZGV0YWlscy4AAAAAAAAMZ2V0X2NhbXBhaWduAAAAAQAAAAAAAAALY2FtcGFpZ25faWQAAAAABgAAAAEAAAfQAAAACENhbXBhaWdu",
        "AAAAAAAAADxDcmVhdGUgYSBuZXcgY3Jvd2RmdW5kaW5nIGNhbXBhaWduLiBSZXR1cm5zIHRoZSBjYW1wYWlnbiBJRC4AAAAPY3JlYXRlX2NhbXBhaWduAAAAAAUAAAAAAAAAB2NyZWF0b3IAAAAAEwAAAAAAAAAFdGl0bGUAAAAAAAAQAAAAAAAAAARnb2FsAAAACwAAAAAAAAAIZGVhZGxpbmUAAAAGAAAAAAAAAAV0b2tlbgAAAAAAABMAAAABAAAABg==",
        "AAAAAAAAABVHZXQgYWxsIGNhbXBhaWduIElEcy4AAAAAAAAQZ2V0X2NhbXBhaWduX2lkcwAAAAAAAAABAAAD6gAAAAY=",
        "AAAAAAAAADdHZXQgYSBjb250cmlidXRvcidzIGNvbnRyaWJ1dGlvbiBhbW91bnQgZm9yIGEgY2FtcGFpZ24uAAAAABBnZXRfY29udHJpYnV0aW9uAAAAAgAAAAAAAAALY2FtcGFpZ25faWQAAAAABgAAAAAAAAALY29udHJpYnV0b3IAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAB5HZXQgdG90YWwgbnVtYmVyIG9mIGNhbXBhaWducy4AAAAAABJnZXRfY2FtcGFpZ25fY291bnQAAAAAAAAAAAABAAAABg==" ]),
      options
    )
  }
  public readonly fromJSON = {
    refund: this.txFromJSON<null>,
        withdraw: this.txFromJSON<null>,
        contribute: this.txFromJSON<null>,
        get_campaign: this.txFromJSON<Campaign>,
        create_campaign: this.txFromJSON<u64>,
        get_campaign_ids: this.txFromJSON<Array<u64>>,
        get_contribution: this.txFromJSON<i128>,
        get_campaign_count: this.txFromJSON<u64>
  }
}