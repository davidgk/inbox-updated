// contract test code will go here
const assert = require('assert');
const {expect} = require('chai');
// Ethereum test network
const ganache = require('ganache-cli');
// how to communicate our code with that.
const Web3 = require('web3')
// get the interface and definition from contract , once compiled
const contractCompiler = require('../config/compile/Inbox')

const localNetworkProvider = ganache.provider();
const web3 = new Web3(localNetworkProvider)

    /**
     *  web3 Main task up to now:
     *  1.- give the accounts unlock to tests our contracts
     *  2.- Deploy our contracts
     *  To deploy it only need the ABI and the bitecode
     *  3.- Communicate through JS apps to our contracts deployed on Network     *
     *  To interact with the contract we need:
     *  ABI ( the interface ! )  and the address of deployed contract!
    */



async function deployContract(contractDeployer, contractCompiled, initialMessage, account) {
    return contractDeployer
        // create the transaction Object to be sent
        .deploy({data: contractCompiled.evm.bytecode.object, arguments: [initialMessage]})
        // this method do the action about communication between Web3 and EN
        .send({from: account, gas: 1000000});
}

describe ('Inbox Contract tests', () => {
    let accounts, inbox, contractDeployer, contractCompiled;
    const initialMessage  = 'Hi there!'
    beforeEach(async () => {
        // Get a list of all accounts
        accounts = await web3.eth.getAccounts();
        // Use one of those accounts to deploy the contract
        contractCompiled = contractCompiler();
        // Teaches to web3 about what methods and inbox has, remember
        // web3 has the bridge role between ou contract and EN
        // abi is the JS layer between deployed code and us
        // we should pass the interface, under JSON format, said nothing about specific contract
        contractDeployer = new web3.eth.Contract(contractCompiled.abi);
    })
    it( 'obtain accounts from web3', () => {
       expect(accounts.length > 0).to.be.true;
    })
    describe('when we deploy it  with an account ' , () => {
        beforeEach(async() => {
            let account = accounts[0];
            inbox = await deployContract(contractDeployer, contractCompiled, initialMessage, account);
        })
        it( 'it was successful', async () => {
            expect(inbox).not.to.be.null;
            // means that it was successfully deploy if address exists
            console.log(inbox.options.address)
            expect(inbox.options.address).not.to.be.null;
            expect(inbox.options.address.length).to.eq(42);
        })
        it( 'once created returns default message', async () => {
            const message = await inbox.methods
                // here we go with the method from contract and params if needed
                .message()
                // here we go to connect to EN and tx data if needed
                // Call is a read only instantaneous operation!! and it's free!
                .call();
            expect(message).to.eq(initialMessage);
        })

        it('once created can change the message', async () =>  {
            let anAccount = accounts[0];
            // if transaction fail will throw an error, and if it's success should retrieve tx id
            // no need to catch or anything
            await inbox.methods.setMessage('bye')
                // Send is a transactional operation , cost MONEY and takes at least 15seconds to be completed in a real EN
                .send({ from: anAccount });
            const message = await inbox.methods.message().call();
            expect(message).to.eq('bye');
        });
    })
})