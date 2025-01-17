<template>
	<section class="transfer">

		<section class="scroller">
			<!----------------------->
			<!--------- FROM -------->
			<!----------------------->
			<section class="greyback" v-if="account && token && toSend">
				<section class="limit-width">
					<section class="boxes">
						<section class="box-container">
							<label>Sending from</label>
							<section class="box nested account-selector" @click="selectTokenAndAccount">
								<section>
									<figure class="name">{{account.sendable()}}</figure>
									<figure class="network">{{account.network().name}}</figure>
									<figure class="token">{{token.amount}} {{token.symbol}}</figure>
									<figure class="price">{{token.fiatPrice() || '--'}}</figure>
								</section>
								<figure class="chevron fas fa-caret-square-down"></figure>
							</section>
						</section>
						<section class="box-container">
							<label>Receiving to</label>
							<section class="box nested">
								<section class="padded recipient-selector" @click="selectRecipient">
									<figure class="name">Contacts</figure>
									<figure class="chevron fas fa-caret-square-down"></figure>
								</section>
								<figure class="line"></figure>
								<section class="input-container">
									<input placeholder="Address / Account" v-model="recipient" class="input" />
								</section>
							</section>
						</section>

					</section>
				</section>
			</section>



			<!----------------------->
			<!---------- TO --------->
			<!----------------------->
			<section class="whiteback" v-if="account && token && toSend">
				<section class="limit-width">
					<label>Amount & Details</label>
					<section class="boxes">
						<section class="box">
							<section class="input-container">
								<figure class="label">{{token.truncatedSymbol()}}</figure>
								<input placeholder="0.00" v-on:input="changedAmount" v-model="toSend.amount" class="input" />
							</section>
							<figure class="line"></figure>
							<section class="input-container">
								<figure class="label">{{displayCurrency}}</figure>
								<input placeholder="0.00" v-if="toSend.fiatPrice()" v-on:input="changedFiat" v-model="fiat" class="input" />
								<figure class="input not-available" v-else>Price not available</figure>
							</section>
						</section>
						<section class="box">
							<section class="input-container">
								<textarea placeholder="optional memo" v-model="memo" class="input"></textarea>
							</section>
						</section>
					</section>
				</section>
			</section>
		</section>


		<section class="tail">
			<Button :disabled="!canSend" big="1" text="Send" blue="1" @click.native="send" />
		</section>
	</section>
</template>

<script>
	import {mapGetters, mapState} from 'vuex';
	import PopupService from "../services/utility/PopupService";
	import {Popup} from "../models/popups/Popup";
	import Token from "@walletpack/core/models/Token";
	import BalanceService from "@walletpack/core/services/blockchain/BalanceService";
	import TransferService from "@walletpack/core/services/blockchain/TransferService";
	import PriceService from "@walletpack/core/services/apis/PriceService";
	import PasswordHelpers from "../services/utility/PasswordHelpers";
	require('../styles/transfers.scss');

	export default {
		data(){return {
			account:null,
			token:null,
			recipient:null,
			memo:'',

			toSend:null,
			fiat:0,

			sending:false,
		}},
		computed:{
			...mapState([
				'history',
			]),
			...mapGetters([
				'accounts',
				'displayCurrency',
				'contacts',
			]),
			sendableTokens(){
				return this.account.tokens().filter(x => !x.unusable).sort((a,b) => {
					return Token.sorter(a,b);
				});
			},
			canSend(){
				return !this.sending && this.recipient && this.recipient.length && this.toSend && this.toSend.amount > 0;
			},
		},
		mounted(){
			const history = this.$route.query.history ? this.history.find(x => x.id === this.$route.query.history) : null;
			const accountAndToken = this.$route.query.account ? (() => {
				const account = this.accounts.find(x => x.identifiable() === this.$route.query.account);
				if(!account) return null;
				return {
					account,
					token:this.$route.query.token ? account.tokens().find(x => x.uniqueWithChain() === this.$route.query.token) : null
				}
			})() : null;

			const recipient = this.$route.query.recipient;


			if(history){
				this.account = history.from;
				this.recipient = history.to;
				this.memo = history.memo;
				this.token = this.account.tokens().find(x => x.uniqueWithChain() === history.token.uniqueWithChain());
				this.toSend = history.token.clone();
				this.toSend.amount = history.amount;
				this.changedAmount();
			}
			else if(accountAndToken){
				this.account = accountAndToken.account;
				if(accountAndToken.token) this.setToken(accountAndToken.token);
				else this.setToken(this.sendableTokens[0]);
			}
			else if (recipient){
				const contact = this.contacts.find(x => x.id === recipient);
				this.recipient = contact.recipient;
				this.account = this.accounts.filter(x => contact.blockchain ? x.blockchain() === contact.blockchain : true)
					.filter(x => x.tokens().length)
					.sort((a,b) => b.totalFiatBalance() - a.totalFiatBalance())[0];
				this.setToken(this.sendableTokens[0]);
			}
			else {
				this.account = this.accounts.filter(x => x.tokens().length)
					.sort((a,b) => b.totalFiatBalance() - a.totalFiatBalance())[0];
				this.setToken(this.sendableTokens[0]);
			}

			// this.recipient = 'safetransfer';
			// this.account = this.accounts.find(x => x.name === 'scatterhwtst');
			// this.memo = 'scatterhwtst';
			// this.toSend.quantity = '1.0000';
			// this.setToken(this.sendableTokens[0]);
		},
		methods:{
			selectTokenAndAccount(){
				PopupService.push(Popup.selectTokenAndAccount(result => {
					if(!result) return;
					const {token, account} = result;
					this.account = account;
					this.setToken(token);
				}))
			},
			selectRecipient(){
				PopupService.push(Popup.selectRecipient(this.account ? this.account.blockchain() : null, recipient => {
					if(!recipient) return;
					this.recipient = recipient;
				}));
			},
			setToken(token){
				if(!token) return;
				PriceService.setPrices();
				this.token = (() => {
					const t = this.account.tokens().find(x => x.uniqueWithChain() === token.uniqueWithChain());
					if(t) return t.clone();
					const clone = token.clone();
					clone.amount = 0;
					return clone;
				})();
				this.toSend = this.token.clone();
				this.toSend.amount = 0;
				this.fiat = 0;
			},
			changedFiat(){
				this.toSend.amount = parseFloat(this.fiat / this.toSend.fiatPrice(false)).toFixed(this.toSend.decimals);
			},
			changedAmount(){
				this.fiat = !this.toSend.amount || this.toSend.amount === '' ? null : this.toSend.fiatBalance(false)
			},
			async send(){
				const reset = () => this.sending = false;
				if(!this.canSend) return;
				// this.sending = true;
				// if(!await PasswordHelpers.verifyPIN()) return reset();
				// this.setWorkingScreen(true);
				const blockchain = this.account.blockchain();
				const sent = await TransferService[blockchain]({
					account:this.account,
					recipient:this.recipient,
					amount:this.toSend.amount,
					memo:this.memo,
					token:this.token,
					promptForSignature:false,
				}).catch(error => {
					console.error('Transfer error', error);
					return false;
				});

				reset();
				this.setWorkingScreen(false);
				if(sent) {
					if(sent.hasOwnProperty('error')){
						PopupService.push(Popup.snackbar(sent.error, "attention-circled"));
					} else if (sent) {
						PopupService.push(Popup.transactionSuccess(blockchain, TransferService.getTransferId(sent, blockchain)));
						setTimeout(() => {
							BalanceService.loadBalancesFor(this.account);
						}, 500);
					} else {
						PopupService.push(Popup.snackbar("An error occurred while trying to transfer these tokens.", "attention-circled"));
					}

				}
			},
		},
	}
</script>

<style scoped lang="scss">
	@import "../styles/variables";



</style>
