<template>
	<section class="center-panel">
		<Lock />
		<br>
		<br>
		<h2>Set a strong password</h2>
		<p><b>Use a strong password</b>, and then memorize it or keep it safe.</p>

		<br>

		<input class="center" type="password" v-model="password" placeholder="choose a password" />
		<section class="password-strength">
			<figure class="bar" :style="{'width':passwordStrength + '%'}" :class="{'red':passwordStrength < 50, 'green':passwordStrength < 100 && passwordStrength >= 50}"></figure>
		</section>
		<input class="center" type="password" v-model="confirmation" placeholder="one more time" />

		<ActionBar :buttons-left="[{text:'Back', click:() => $emit('back')}]" :buttons-right="[{text:'Next', blue:true, click:checkPassword}]" />
	</section>
</template>

<script>
	import {mapActions} from 'vuex';
	import PasswordService from "@walletpack/core/services/secure/PasswordService";
	import Lock from '../svgs/Lock'
	import * as UIActions from "../../store/ui_actions";
	import PopupService from "../../services/utility/PopupService";
	import {Popup} from "../../models/popups/Popup";

	export default {
		components:{Lock},
		data(){return {
			password:'',
			confirmation:'',
		}},
		computed:{
			passwordStrength(){
				const clamp = (min, max, val) => {
					if(val < min) val = min;
					if(val > max) val = max;
					return val;
				}

				let total = 0;
				if(this.password.length >= 8) total += clamp(0, 4, this.password.length-7);
				if(PasswordService.uppercaseCount(this.password) >= 2) total += clamp(0, 4, PasswordService.uppercaseCount(this.password)-1);
				if(PasswordService.lowercaseCount(this.password) >= 2) total += clamp(0, 4, PasswordService.lowercaseCount(this.password)-1);
				if(PasswordService.specialCharCount(this.password) >= 2) total += clamp(0, 4, PasswordService.specialCharCount(this.password)-1);
				return total / 8 / 2 * 100;
			},
		},
		methods:{
			async checkPassword(){

				const err = PasswordService.hasError(this.password);
				if(err) return PopupService.push(Popup.snackbar(err));
				if(this.password !== this.confirmation) return PopupService.push(Popup.snackbar("Password confirmation does not match password"));

				this.setWorkingScreen(true);
				await this[UIActions.CREATE_SCATTER](this.password);
				this.setWorkingScreen(false);

				this.$emit('next');
			},

			...mapActions([
				UIActions.CREATE_SCATTER
			])
		}
	}
</script>

<style scoped lang="scss">
	@import "../../styles/variables";

	.password-strength {
		width:100%;
		height:14px;
		line-height: 14px;
		margin-top:-4px;
		border-radius:4px;
		border-top-left-radius:0;
		border-top-right-radius:0;
		overflow: hidden;
		background:#ffffff;
		position: relative;
		border: 1px solid rgba(0, 0, 0, 0.1);
		padding:4px;
		.bar {
			background:$blue;
			height:4px;
			border-radius:20px;
			transition: all 0.5s ease;
			transition-property: width, background;
			&.red {
				background:$red;
			}
			&.green {
				background:$green;
			}
		}
	}

</style>