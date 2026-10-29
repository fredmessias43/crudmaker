<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\PlayerInvite;
use Illuminate\Validation\Rule;


class PlayerInviteRequest extends FormRequest
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
			$playerInvite = $this->route('player_invite');
	
			if ($playerInvite instanceof PlayerInvite)
			{
					$this->merge(['id' => $playerInvite->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $playerInvite->id]);
					}
	
					if ( ! $this->has('player_id'))
					{
							$this->merge(['player_id' => $playerInvite->player_id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $playerInvite->game_id]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $playerInvite->status]);
					}
	
			}
			else
			{
					//
			}
	}

	/**
	 * Get the validation rules that apply to the request.
	 *
	 * @return array
	*/
	public function rules()
	{
			return [
				'player_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'game_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'status' => array(
					'bail',
					'required',
					Rule::in(array('pending','accepted','declined')),
				),
			];
	}

};
