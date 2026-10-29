<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Enum do campo status da entidade Account; para mudar os valores, altere os enumItems no manifest.

namespace App\Generated\Enums;

enum AccountStatus: string
{
	case Pending = 'pending';
	case Active = 'active';
	case Blocked = 'blocked';
}
