<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Enum do campo status da entidade OrderItem; para mudar os valores, altere os enumItems no manifest.

namespace App\Generated\Enums;

enum OrderItemStatus: string
{
	case Pending = 'pending';
	case Shipped = 'shipped';
}
