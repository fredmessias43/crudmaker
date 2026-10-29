<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Cards;


class CardsRequest extends FormRequest
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
			$cards = $this->route('cards');
	
			if ($cards instanceof Cards)
			{
					$this->merge(['id' => $cards->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $cards->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $cards->game_id]);
					}
	
					if ( ! $this->has('player_id'))
					{
							$this->merge(['player_id' => $cards->player_id]);
					}
	
					if ( ! $this->has('numbers'))
					{
							$this->merge(['numbers' => $cards->numbers]);
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
				'game_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'player_id' => array(
					'bail',
					'required',
					'uuid',
				),
				'numbers' => array(
					'bail',
					'required',
					'array',
				),
			];
	}

};
