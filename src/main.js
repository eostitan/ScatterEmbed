import './styles/styles.scss'
import './styles/animations.scss'
import './styles/popins.scss'
import './styles/confirm.scss'
import './styles/blockchain-lists.scss'

import WalletHelpers from './util/WalletHelpers';

import VueInitializer from './vue/VueInitializer';
import {RouteNames, Routing} from './vue/Routing';
import { QrcodeReader } from 'vue-qrcode-reader'


import ViewBase from './components/ViewBase.vue'
import Button from './components/reusable/Button.vue'
import Input from './components/reusable/Input.vue'
import Select from './components/reusable/Select.vue'
import SearchBar from './components/reusable/SearchBar.vue'
import Slider from './components/reusable/Slider.vue'
import PopInHead from './components/reusable/PopInHead.vue'
import Switcher from './components/reusable/Switcher.vue'
import SearchAndFilter from './components/reusable/SearchAndFilter.vue'
import AnimatedNumber from './components/reusable/AnimatedNumber.vue'
import ActionBar from './components/reusable/ActionBar.vue'
import PopOutHead from './components/popouts/PopOutHead.vue'
import WalletTalk from "./util/WalletTalk";
import * as Actions from "@walletpack/core/store/constants";
import {store} from "./store/store";

import '@fortawesome/fontawesome-pro/css/all.css'
import SingletonService from "./services/utility/SingletonService";

// f12 to open console from anywhere.
document.addEventListener("keydown", e => {
	if (e.which === 123) window.wallet.utility.openTools(window.wallet.windowId);
});

document.onmousedown= e => {
	if( e.which === 2 ) e.preventDefault();
	// TODO: Add CMD click logic prevention
}

class Main {

	constructor(){
		const isPopOut = location.hash.replace("#/", '') === 'popout';

		const setup = () => {

			const shared = [
				{tag:'Button', vue:Button},
				{tag:'Input', vue:Input},
				{tag:'Select', vue:Select},
				{tag:'Slider', vue:Slider},
				{tag:'Switcher', vue:Switcher},
				{tag:'SearchBar', vue:SearchBar},
				{tag:'SearchAndFilter', vue:SearchAndFilter},
				{tag:'ActionBar', vue:ActionBar},
				{tag:'view-base', vue:ViewBase},
				{tag:'PopInHead', vue:PopInHead},
				{tag:'AnimatedNumber', vue:AnimatedNumber},
			];

			let fragments;
			if(isPopOut) fragments = [
				{tag:'PopOutHead', vue:PopOutHead},
			]; else fragments = [
				{tag:'qr-reader', vue:QrcodeReader},
			]

			const components = shared.concat(fragments);

			const middleware = (to, next) => {
				if(isPopOut) return next();
				else if(Routing.isRestricted(to.name)) window.wallet.unlocked() ? next() : next({name:RouteNames.LOGIN});
				else next();
			}

			new VueInitializer(Routing.routes(), components, middleware, async (router) => {

			});

			return true;
		};



		const setupWallet = async () => {
			WalletTalk.setup();
			WalletHelpers.init();
			//if(!isPopOut) await store.dispatch(Actions.LOAD_SCATTER);

			return setup();
		}

		if(process.env.NO_WALLET){

			WalletTalk.setFakeWallet().then(async () => {
				await setupWallet();
				SingletonService.init();
			})

		} else {

			let interval;
			interval = setInterval(() => {
				if(window.wallet){
					clearInterval(interval);
					setupWallet();
				}
			}, 1);


		}


	}

}

new Main();
