#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, panic_with_error, token, Address, Env, String, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    CampaignNotFound = 1,
    AlreadyWithdrawn = 2,
    DeadlinePassed = 3,
    DeadlineNotPassed = 4,
    GoalNotMet = 5,
    GoalAlreadyMet = 6,
    NoContribution = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct Campaign {
    pub creator: Address,
    pub title: String,
    pub goal: i128,
    pub deadline: u64,
    pub total_raised: i128,
    pub withdrawn: bool,
    pub token: Address,
}

#[contracttype]
pub enum DataKey {
    Campaign(u64),
    Contribution(u64, Address),
    CampaignCount,
    CampaignIds,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Create a new crowdfunding campaign. Returns the campaign ID.
    pub fn create_campaign(
        env: Env,
        creator: Address,
        title: String,
        goal: i128,
        deadline: u64,
        token: Address,
    ) -> u64 {
        creator.require_auth();
        let mut count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);
        count += 1;
        let campaign = Campaign {
            creator,
            title,
            goal,
            deadline,
            total_raised: 0,
            withdrawn: false,
            token,
        };
        env.storage()
            .instance()
            .set(&DataKey::Campaign(count), &campaign);
        env.storage()
            .instance()
            .set(&DataKey::CampaignCount, &count);
        let mut ids: Vec<u64> = env
            .storage()
            .instance()
            .get(&DataKey::CampaignIds)
            .unwrap_or(Vec::new(&env));
        ids.push_back(count);
        env.storage()
            .instance()
            .set(&DataKey::CampaignIds, &ids);
        count
    }

    /// Contribute `amount` tokens to a campaign.
    /// Transfers tokens from contributor to the contract.
    pub fn contribute(env: Env, contributor: Address, campaign_id: u64, amount: i128) {
        contributor.require_auth();
        let campaign = env
            .storage()
            .instance()
            .get::<_, Campaign>(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");
        if campaign.withdrawn {
            panic_with_error!(&env, Error::AlreadyWithdrawn)
        }
        if env.ledger().timestamp() >= campaign.deadline {
            panic_with_error!(&env, Error::DeadlinePassed)
        }

        // Transfer tokens from contributor to this contract
        let token_client = token::TokenClient::new(&env, &campaign.token);
        token_client.transfer(&contributor, &env.current_contract_address(), &amount);

        // Update campaign total_raised
        let mut updated = campaign;
        updated.total_raised += amount;
        env.storage()
            .instance()
            .set(&DataKey::Campaign(campaign_id), &updated);

        // Update contributor's contribution record
        let key = DataKey::Contribution(campaign_id, contributor.clone());
        let existing: i128 = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&key, &(existing + amount));
    }

    /// Withdraw all raised funds (creator only, after deadline, goal met).
    pub fn withdraw(env: Env, campaign_id: u64) {
        let campaign = env
            .storage()
            .instance()
            .get::<_, Campaign>(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");
        campaign.creator.require_auth();
        if campaign.withdrawn {
            panic_with_error!(&env, Error::AlreadyWithdrawn)
        }
        if env.ledger().timestamp() < campaign.deadline {
            panic_with_error!(&env, Error::DeadlineNotPassed)
        }
        if campaign.total_raised < campaign.goal {
            panic_with_error!(&env, Error::GoalNotMet)
        }

        // Transfer all raised tokens to the creator
        let token_client = token::TokenClient::new(&env, &campaign.token);
        token_client.transfer(
            &env.current_contract_address(),
            &campaign.creator,
            &campaign.total_raised,
        );

        let mut updated = campaign;
        updated.withdrawn = true;
        env.storage()
            .instance()
            .set(&DataKey::Campaign(campaign_id), &updated);
    }

    /// Refund a contributor (after deadline, goal not met).
    pub fn refund(env: Env, campaign_id: u64, contributor: Address) {
        contributor.require_auth();
        let campaign = env
            .storage()
            .instance()
            .get::<_, Campaign>(&DataKey::Campaign(campaign_id))
            .expect("campaign not found");
        if campaign.withdrawn {
            panic_with_error!(&env, Error::AlreadyWithdrawn)
        }
        if env.ledger().timestamp() < campaign.deadline {
            panic_with_error!(&env, Error::DeadlineNotPassed)
        }
        if campaign.total_raised >= campaign.goal {
            panic_with_error!(&env, Error::GoalAlreadyMet)
        }

        let key = DataKey::Contribution(campaign_id, contributor.clone());
        let contribution: i128 = env
            .storage()
            .instance()
            .get(&key)
            .unwrap_or(0);
        if contribution == 0 {
            panic_with_error!(&env, Error::NoContribution)
        }

        // Transfer contribution back to contributor
        let token_client = token::TokenClient::new(&env, &campaign.token);
        token_client.transfer(
            &env.current_contract_address(),
            &contributor,
            &contribution,
        );

        // Zero out the contribution record
        env.storage().instance().set(&key, &0i128);
    }

    /// Get campaign details.
    pub fn get_campaign(env: Env, campaign_id: u64) -> Campaign {
        env.storage()
            .instance()
            .get(&DataKey::Campaign(campaign_id))
            .expect("campaign not found")
    }

    /// Get a contributor's contribution amount for a campaign.
    pub fn get_contribution(env: Env, campaign_id: u64, contributor: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Contribution(campaign_id, contributor))
            .unwrap_or(0)
    }

    /// Get total number of campaigns.
    pub fn get_campaign_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    /// Get all campaign IDs.
    pub fn get_campaign_ids(env: Env) -> Vec<u64> {
        env.storage()
            .instance()
            .get(&DataKey::CampaignIds)
            .unwrap_or(Vec::new(&env))
    }
}

mod test;
