<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\DrawnNumbers;


class DrawnNumbersRequest extends FormRequest
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
			$drawnNumbers = $this->route('drawn_numbers');
	
			if ($drawnNumbers instanceof DrawnNumbers)
			{
					$this->merge(['id' => $drawnNumbers->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $drawnNumbers->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $drawnNumbers->game_id]);
					}
	
					if ( ! $this->has('number'))
					{
							$this->merge(['number' => $drawnNumbers->number]);
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
