<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Enum do campo status da entidade PlayerInvite; para mudar os valores, altere os enumItems no manifest.

namespace App\Generated\Enums;

enum PlayerInviteStatus: string
{
	case Pending = 'pending';
	case Accepted = 'accepted';
	case Declined = 'declined';
}
