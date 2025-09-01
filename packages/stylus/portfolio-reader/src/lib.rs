#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
};

sol_storage! {
    #[entrypoint]
    pub struct PortfolioReader {
        address owner;
        string greeting;
        uint256 total_reads;
    }
}

#[public]
impl PortfolioReader {
    #[constructor]
    pub fn constructor(&mut self, initial_owner: Address) {
        self.owner.set(initial_owner);
        self.greeting.set_str("Portfolio Reader Ready!");
        self.total_reads.set(U256::ZERO);
    }

    pub fn owner(&self) -> Address {
        self.owner.get()
    }

    pub fn greeting(&self) -> String {
        self.greeting.get_string()
    }

    pub fn total_reads(&self) -> U256 {
        self.total_reads.get()
    }

    pub fn get_portfolio_balances(
        &mut self,
        user: Address,
        token_addresses: Vec<Address>,
    ) -> U256 {

        let current_reads = self.total_reads.get();
        self.total_reads.set(current_reads + U256::from(1));

        U256::from(token_addresses.len())
    }

    pub fn get_eth_balance(&self, user: Address) -> U256 {
        self.vm().balance(user)
    }
}