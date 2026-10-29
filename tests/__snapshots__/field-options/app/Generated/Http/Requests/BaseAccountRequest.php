<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Requests\AccountRequest (app/Http/Requests/AccountRequest.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Account;
use App\Generated\Enums\AccountStatus;
use App\Generated\Enums\AccountPlan;
use Illuminate\Validation\Rule;


abstract class BaseAccountRequest extends FormRequest
{

	/**
	 * Determine if the user is authorized to make this request.
	 *
	 * @return bool
	 */
	public function authorize()
	{
		return true;
	}

	/**
	 * Prepare the data for validation.
	 *
	 * @return void
	 */
	protected function prepareForValidation()
	{
			$account = $this->route('account');
	
			if ($account instanceof Account)
			{
					$this->merge(['id' => $account->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $account->id]);
					}
	
					if ( ! $this->has('password'))
					{
							$this->merge(['password' => $account->password]);
					}
	
					if ( ! $this->has('email'))
					{
							$this->merge(['email' => $account->email]);
					}
	
					if ( ! $this->has('nickname'))
					{
							$this->merge(['nickname' => $account->nickname]);
					}
	
					if ( ! $this->has('bio'))
					{
							$this->merge(['bio' => $account->bio]);
					}
	
					if ( ! $this->has('owner_ref'))
					{
							$this->merge(['owner_ref' => $account->owner_ref]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $account->status?->value]);
					}
	
					if ( ! $this->has('plan'))
					{
							$this->merge(['plan' => $account->plan?->value]);
					}
	
					if ( ! $this->has('age'))
					{
							$this->merge(['age' => $account->age]);
					}
	
					if ( ! $this->has('credit'))
					{
							$this->merge(['credit' => $account->credit]);
					}
	
					if ( ! $this->has('score'))
					{
							$this->merge(['score' => $account->score]);
					}
	
					if ( ! $this->has('active'))
					{
							$this->merge(['active' => $account->active]);
					}
	
					if ( ! $this->has('newsletter'))
					{
							$this->merge(['newsletter' => $account->newsletter]);
					}
	
					if ( ! $this->has('birthday'))
					{
							$this->merge(['birthday' => $account->birthday?->format('Y-m-d')]);
					}
	
					if ( ! $this->has('last_seen'))
					{
							$this->merge(['last_seen' => $account->last_seen?->format('Y-m-d H:i')]);
					}
	
					if ( ! $this->has('settings'))
					{
							$this->merge(['settings' => $account->settings]);
					}
	
			}
			else
			{
					//
			}
	}

	/**
	 * Get the validation rules that apply to the request: as geradas mais as de `extraRules()`.
	 *
	 * @return array
	*/
	public function rules()
	{
			return array_merge($this->generatedRules(), $this->extraRules());
	}

	/**
	 * Hook: regras de validação que se somam às geradas (a mesma chave de campo substitui a regra gerada).
	 * Sobrescreva na classe final. Para mudar a autorização, sobrescreva também `authorize()` lá.
	 *
	 * @return array
	 */
	protected function extraRules(): array
	{
		return [];
	}

	/**
	 * Regras geradas a partir do manifest.
	 *
	 * @return array
	 */
	private function generatedRules(): array
	{
			return [
				'password' => array(
					'bail',
					'required',
					'string',
					'min:8',
				),
				'email' => array(
					'bail',
					'required',
					'string',
					Rule::unique('accounts', 'email')->ignore($this->route('account')),
					'email',
					'max:120',
				),
				'nickname' => array(
					'bail',
					'nullable',
					'string',
				),
				'bio' => array(
					'bail',
					'required',
					'string',
				),
				'owner_ref' => array(
					'bail',
					'required',
					'uuid',
				),
				'status' => array(
					'bail',
					'required',
					Rule::enum(AccountStatus::class),
				),
				'plan' => array(
					'bail',
					'required',
					Rule::enum(AccountPlan::class),
				),
				'age' => array(
					'bail',
					'required',
					'integer',
				),
				'credit' => array(
					'bail',
					'required',
					'numeric',
				),
				'score' => array(
					'bail',
					'required',
					'integer',
				),
				'active' => array(
					'bail',
					'required',
					'boolean',
				),
				'newsletter' => array(
					'bail',
					'required',
					'boolean',
				),
				'birthday' => array(
					'bail',
					'required',
					'date_format:Y-m-d',
				),
				'last_seen' => array(
					'bail',
					'required',
					'date_format:Y-m-d H:i',
				),
				'settings' => array(
					'bail',
					'required',
					'array',
				),
			];
	}

}
