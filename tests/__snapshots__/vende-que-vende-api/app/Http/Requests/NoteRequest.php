<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Note;


class NoteRequest extends FormRequest
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
			$note = $this->route('note');
	
			if ($note instanceof Note)
			{
					$this->merge(['id' => $note->id]);
	
					if ( ! $this->has('id'))
					{
							$this->merge(['id' => $note->id]);
					}
	
					if ( ! $this->has('content'))
					{
							$this->merge(['content' => $note->content]);
					}
	
					if ( ! $this->has('client_id'))
					{
							$this->merge(['client_id' => $note->client_id]);
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
				'content' => array(
					'bail',
					'required',
					'string',
				),
				'client_id' => array(
					'bail',
					'required',
					'uuid',
				),
			];
	}

};
