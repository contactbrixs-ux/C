#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};
use soroban_sdk::{token, Env, String};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (token::TokenClient<'a>, token::StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        token::TokenClient::new(env, &sac.address()),
        token::StellarAssetClient::new(env, &sac.address()),
    )
}

fn advance_ledger(env: &Env, to_timestamp: u64) {
    env.ledger().set(LedgerInfo {
        timestamp: to_timestamp,
        protocol_version: 25,
        sequence_number: 200,
        network_id: [0; 32],
        base_reserve: 10,
        min_persistent_entry_ttl: 100,
        min_temp_entry_ttl: 100,
        max_entry_ttl: 100000,
    });
}

#[test]
fn test_create_campaign() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let (token, _) = create_token_contract(&env, &creator);
    let deadline = env.ledger().timestamp() + 1000;

    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Help build a school"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    assert_eq!(campaign_id, 1);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.creator, creator);
    assert_eq!(campaign.title, String::from_str(&env, "Help build a school"));
    assert_eq!(campaign.goal, 1_000_000_000);
    assert_eq!(campaign.deadline, deadline);
    assert_eq!(campaign.total_raised, 0);
    assert_eq!(campaign.withdrawn, false);
    assert_eq!(campaign.token, token.address);
}

#[test]
fn test_contribute() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    // Mint tokens to contributor
    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 1000;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Help build a school"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    assert_eq!(token.balance(&contributor), 10_000_000_000);
    assert_eq!(token.balance(&contract_id), 0);

    client.contribute(&contributor, &campaign_id, &500_000_000i128);

    // Check balances after contribution
    assert_eq!(token.balance(&contributor), 9_500_000_000);
    assert_eq!(token.balance(&contract_id), 500_000_000);

    // Check campaign state
    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.total_raised, 500_000_000);

    // Check contribution record
    let contribution = client.get_contribution(&campaign_id, &contributor);
    assert_eq!(contribution, 500_000_000);
}

#[test]
fn test_contribute_multiple() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&alice, &10_000_000_000i128);
    token_admin.mint(&bob, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 1000;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Help build a school"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    client.contribute(&alice, &campaign_id, &300_000_000i128);
    client.contribute(&bob, &campaign_id, &700_000_000i128);

    assert_eq!(client.get_contribution(&campaign_id, &alice), 300_000_000);
    assert_eq!(client.get_contribution(&campaign_id, &bob), 700_000_000);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.total_raised, 1_000_000_000);
    assert_eq!(token.balance(&contract_id), 1_000_000_000);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #3)")]
fn test_contribute_after_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 100;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Test"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    // Advance past deadline
    advance_ledger(&env, deadline + 1);

    // This should panic with DeadlinePassed (Error #3)
    client.contribute(&contributor, &campaign_id, &500_000_000i128);
}

#[test]
fn test_withdraw_goal_met() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 100;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Test campaign"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    // Contribute enough to meet goal
    client.contribute(&contributor, &campaign_id, &1_000_000_000i128);

    assert_eq!(token.balance(&contract_id), 1_000_000_000);
    assert_eq!(token.balance(&creator), 0);

    // Advance past deadline
    advance_ledger(&env, deadline + 1);

    // Creator withdraws
    client.withdraw(&campaign_id);

    // Check: contract should have 0, creator should have the funds
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&creator), 1_000_000_000);

    let campaign = client.get_campaign(&campaign_id);
    assert!(campaign.withdrawn);
}

#[test]
fn test_refund_goal_not_met() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 100;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Test campaign"),
        &5_000_000_000i128, // goal is 5000
        &deadline,
        &token.address,
    );

    // Contribute only part of the goal
    client.contribute(&contributor, &campaign_id, &500_000_000i128);

    assert_eq!(token.balance(&contract_id), 500_000_000);

    // Advance past deadline
    advance_ledger(&env, deadline + 1);

    // Contributor refunds
    client.refund(&campaign_id, &contributor);

    // Check: contract should have 0, contributor should have their tokens back
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&contributor), 10_000_000_000);

    // Contribution should be zeroed
    assert_eq!(client.get_contribution(&campaign_id, &contributor), 0);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #5)")]
fn test_withdraw_goal_not_met() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 100;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Test"),
        &5_000_000_000i128,
        &deadline,
        &token.address,
    );

    client.contribute(&contributor, &campaign_id, &500_000_000i128);
    advance_ledger(&env, deadline + 1);

    // This should panic with GoalNotMet (Error #5)
    client.withdraw(&campaign_id);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #4)")]
fn test_withdraw_before_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let contributor = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&contributor, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 1000;
    let campaign_id = client.create_campaign(
        &creator,
        &String::from_str(&env, "Test"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    client.contribute(&contributor, &campaign_id, &1_000_000_000i128);

    // Don't advance past deadline
    // This should panic with DeadlineNotPassed (Error #4)
    client.withdraw(&campaign_id);
}

#[test]
fn test_get_campaign_count_and_ids() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let (token, _) = create_token_contract(&env, &creator);
    let deadline = env.ledger().timestamp() + 1000;

    assert_eq!(client.get_campaign_count(), 0);

    client.create_campaign(
        &creator,
        &String::from_str(&env, "Campaign 1"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );

    assert_eq!(client.get_campaign_count(), 1);

    let deadline2 = deadline + 100;
    client.create_campaign(
        &creator,
        &String::from_str(&env, "Campaign 2"),
        &2_000_000_000i128,
        &deadline2,
        &token.address,
    );

    assert_eq!(client.get_campaign_count(), 2);

    let ids = client.get_campaign_ids();
    assert_eq!(ids.len(), 2);
    assert_eq!(ids.get(0).unwrap(), 1);
    assert_eq!(ids.get(1).unwrap(), 2);
}

#[test]
fn test_multiple_campaigns_independent() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let (token, token_admin) = create_token_contract(&env, &creator);

    token_admin.mint(&alice, &10_000_000_000i128);
    token_admin.mint(&bob, &10_000_000_000i128);

    let deadline = env.ledger().timestamp() + 1000;

    let campaign1 = client.create_campaign(
        &creator,
        &String::from_str(&env, "Campaign 1"),
        &1_000_000_000i128,
        &deadline,
        &token.address,
    );
    let campaign2 = client.create_campaign(
        &creator,
        &String::from_str(&env, "Campaign 2"),
        &2_000_000_000i128,
        &deadline,
        &token.address,
    );

    client.contribute(&alice, &campaign1, &500_000_000i128);
    client.contribute(&bob, &campaign2, &1_000_000_000i128);

    assert_eq!(client.get_contribution(&campaign1, &alice), 500_000_000);
    assert_eq!(client.get_contribution(&campaign1, &bob), 0);
    assert_eq!(client.get_contribution(&campaign2, &alice), 0);
    assert_eq!(client.get_contribution(&campaign2, &bob), 1_000_000_000);

    assert_eq!(client.get_campaign(&campaign1).total_raised, 500_000_000);
    assert_eq!(client.get_campaign(&campaign2).total_raised, 1_000_000_000);
}
