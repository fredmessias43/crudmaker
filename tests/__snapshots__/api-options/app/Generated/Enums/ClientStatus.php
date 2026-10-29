<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Enum do campo status da entidade Client; para mudar os valores, altere os enumItems no manifest.

namespace App\Generated\Enums;

enum ClientStatus: string
{
	case Active = 'active';
	case Blocked = 'blocked';
}
