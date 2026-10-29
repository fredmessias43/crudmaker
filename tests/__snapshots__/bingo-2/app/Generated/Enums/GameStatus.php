<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Enum do campo status da entidade Game; para mudar os valores, altere os enumItems no manifest.

namespace App\Generated\Enums;

enum GameStatus: string
{
	case Active = 'active';
	case Inactive = 'inactive';
	case Archived = 'archived';
	case Completed = 'completed';
}
