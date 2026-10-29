<?php

namespace App\Models;

use App\Generated\Models\BaseGame;

/**
 * Camada de customização da model Game.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado (traits, $casts, $fillable e relacionamentos do manifest) fica em
 * App\Generated\Models\BaseGame (app/Generated/Models/BaseGame.php), que não deve ser editada.
 */
class Game extends BaseGame
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
