<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Player;


class PlayerRequest extends FormRequest
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
			$player = $this->route('player');
	
			if ($player instanceof Player)
			{
					$this->merge(['id' => $player->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $player->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $player->name]);
					}
	
					if ( ! $this->has('email'))
					{
							$this->merge(['email' => $player->email]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $player->game_id]);
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
				'name' => array(
					'bail',
					'required',
					'string',
				),
				'email' => array(
					'bail',
					'required',
					'string',
				),
				'game_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
