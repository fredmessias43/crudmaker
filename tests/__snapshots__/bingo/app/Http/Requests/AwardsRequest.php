<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Awards;


class AwardsRequest extends FormRequest
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
			$awards = $this->route('awards');
	
			if ($awards instanceof Awards)
			{
					$this->merge(['id' => $awards->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $awards->id]);
					}
	
					if ( ! $this->has('game_id'))
					{
							$this->merge(['game_id' => $awards->game_id]);
					}
	
					if ( ! $this->has('name'))
					{
							$this->merge(['name' => $awards->name]);
					}
	
					if ( ! $this->has('description'))
					{
							$this->merge(['description' => $awards->description]);
					}
	
					if ( ! $this->has('image_url'))
					{
							$this->merge(['image_url' => $awards->image_url]);
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
				'image_url' => array(
					'bail',
					'required',
					'string',
				),
			];
	}

};
