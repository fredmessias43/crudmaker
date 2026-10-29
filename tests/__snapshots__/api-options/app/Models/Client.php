<?php

namespace App\Models;

use App\Generated\Models\BaseClient;

/**
 * Camada de customização da model Client.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado (traits, $casts, $fillable e relacionamentos do manifest) fica em
 * App\Generated\Models\BaseClient (app/Generated/Models/BaseClient.php), que não deve ser editada.
 */
class Client extends BaseClient
{
	/*
	 * A model não tem hooks: use os recursos do Eloquent aqui, por exemplo
	 *
	 *   - scopes locais e globais (scopeAtivos, #[ScopedBy]);
	 *   - accessors e mutators (Attribute::make);
	 *   - $hidden, $appends e relacionamentos extras;
	 *   - eventos no booted() (static::creating, static::deleting...);
	 *   - mais casts ou campos em massa, somados aos gerados: $this->mergeCasts([...]) e
	 *     $this->mergeFillable([...]) num __construct(array $attributes = []) que chame parent::__construct($attributes).
	 *     (Redeclarar $casts ou $fillable aqui substituiria os gerados.)
	 */
}
