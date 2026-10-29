<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\DrawnNumber;


class DrawnNumberRequest extends FormRequest
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
			$drawnNumber = $this->route('drawn_number');
	
			if ($drawnNumber instanceof DrawnNumber)
			{
					$this->merge(['id' => $drawnNumber->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $drawnNumber->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $drawnNumber->game_id]);
					}
	
					if ( ! $this->has('number'))
					{
							$this->merge(['number' => $drawnNumber->number]);
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
				'number' => array(
					'bail',
					'required',
					'integer',
				),
			];
	}

};
