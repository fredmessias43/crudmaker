<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Game;
use Illuminate\Validation\Rule;


class GameRequest extends FormRequest
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
			$game = $this->route('game');
	
			if ($game instanceof Game)
			{
					$this->merge(['id' => $game->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $game->id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $game->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $game->description]);
					}
	
					if ( ! $this->has('max_players'))
					{
							$this->merge(['max_players' => $game->max_players]);
					}
	
					if ( ! $this->has('document'))
					{
							$this->merge(['document' => $game->document]);
					}
	
					if ( ! $this->has('status'))
					{
							$this->merge(['status' => $game->status]);
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
				'description' => array(
					'bail',
					'required',
					'string',
				),
				'max_players' => array(
					'bail',
					'required',
					'integer',
				),
				'document' => array(
					'bail',
					'required',
					'string',
				),
				'status' => array(
					'bail',
					'required',
					Rule::in(array('active','inactive','archived','completed')),
				),
			];
	}

};
